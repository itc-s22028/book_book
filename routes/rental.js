// rental.js

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const loginCheck = (req, res, next) => {
    if (!req.user) {
        req.session.returnTo = "/rental";
        res.redirect("/users/login");
        return;
    }
    next();
};

router.post("/start", async (req, res) => {
    try {
        const bookId = req.body.bookId;

        // 貸出データベース内で指定された書籍が既に貸し出されているか確認
        const existingRental = await prisma.rental.findFirst({
            where: {
                bookId: bookId,
                returnDate: null // まだ返却されていないものを対象にする
            }
        });

        // 既に貸し出されている場合
        if (existingRental) {
            return res.status(409).json({ error: "貸出中のため失敗" });
        }

        // 貸出を開始
        const createdRental = await prisma.rental.create({
            data: {
                bookId: bookId,
                userId: req.user.id,  // ログインしているユーザーのIDや他の情報を追加
                rentalDate: new Date(),
                returnDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日後
                returnDate: null
                // 他の貸出データの初期値
            }
        });

        const response = {
            message: "貸出成功",
            rental: {
                id: createdRental.id,
                bookId: createdRental.bookId,
                rentalDate: createdRental.rentalDate,
                returnDeadline: createdRental.returnDeadline,
                returnDate: createdRental.returnDate
            }
        };

// userId と returnDate を表示したくない場合
        delete response.rental.userId;
        delete response.rental.returnDate;

        return res.status(201).json({
            // message: "貸出成功",
            // rental: createdRental
            response
        });

    } catch (error) {
        console.error("Error starting rental:", error);
        return res.status(400).json({ error: "その他のエラーが発生しました。" });
    }
});

//返却

router.put("/return", loginCheck, async (req, res) => {
    try {
        const rentalId = req.body.id;

        // Step 1: 貸出情報を確認
        const existingRental = await prisma.rental.findFirst({
            where: {
                id: rentalId,
                userId: req.user.id, // ログインしているユーザーのIDに修正
                returnDate: null // 未返却のものを検索
            }
        });

        if (!existingRental) {
            return res.status(404).json({ result: "NG"　});
        }

// Step 3: 返却処理
        if (existingRental) {
            const returnedRental = await prisma.rental.update({
                where: {
                    id: existingRental.id
                },
                data: {
                    returnDate: new Date()
                }
            });
            return res.status(200).json({ result: "OK" });
        } else {
            return res.status(404).json({ result: "NG"　});
        }

    } catch (error) {
        console.error("Error returning rental:", error);
        return res.status(400).json({ result: "NG"　});
    }
});


//貸出一覧

router.get("/current", loginCheck, async (req, res) => {
    try {
        const userId = req.user.id;

        // 貸出情報を取得
        const rentalBooks = await prisma.rental.findMany({
            where: {
                userId: userId,
                returnDate: null // 未返却のものを検索
            },
            select: {
                id: true,
                bookId: true,
                rentalDate: true,
                returnDeadline: true,
                books: {
                    select: {
                        title: true
                    }
                }
            }
        });

        // レスポンスデータの整形
        const formattedResponse = rentalBooks.map(book => ({
            rentalId: book.id,
            bookId: book.bookId,
            bookName: book.books.title,
            rentalDate: book.rentalDate,
            returnDeadline: book.returnDeadline
        }));

        return res.status(200).json({
            rentalBooks: formattedResponse
        });

    } catch (error) {
        console.error("Error fetching current rental books:", error);
        return res.status(500).json({ error: "サーバーエラーが発生しました。" });
    }
});


module.exports = router;
