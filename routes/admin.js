// routes/admin.js

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { check, validationResult } = require("express-validator");


const prisma = new PrismaClient(); // PrismaClientを初期化

// Middleware to check if the user is an admin
const isAdmin = async (req, res, next) => {
    try {
        // ログイン中のユーザー情報を取得
        const currentUser = req.user;

        // req.user が未定義の場合のハンドリング
        if (!currentUser) {
            res.status(403).json({ result: 'NG', error: 'Permission denied. User not logged in.' });
            return;
        }

        // Prismaを使用してユーザーの権限を取得
        const user = await prisma.users.findUnique({
            where: { id: currentUser.id },
            select: { isAdmin: true } // isAdminがtrueかfalseで取得
        });

        if (user && user.isAdmin === true) {
            // ユーザーが管理者の場合
            next();
        } else {
            // ユーザーが管理者でない場合は権限エラー
            res.status(403).json({ result: 'NG', error: 'Permission denied. Must be an admin.' });
        }
    } catch (error) {
        console.error('Error during isAdmin check:', error);
        // エラーが発生した場合はエラーレスポンスを返す
        res.status(500).json({ result: 'NG', error: 'Internal server error.' });
    }
};


//書籍情報更新

router.put("/book/update", isAdmin, async (req, res) => {
    try {
        const { bookId, isbn13, title, author, publishDate } = req.body;

        // 書籍が存在するか確認
        const existingBook = await prisma.books.findUnique({
            where: {
                id: bookId
            }
        });

        if (!existingBook) {
            return res.status(404).json({ result: "NG", error: "指定された書籍は存在しません。" });
        }

        // 書籍情報を更新
        const updatedBook = await prisma.books.update({
            where: {
                id: bookId
            },
            data: {
                isbn13: isbn13,
                title: title,
                author: author,
                publishDate: publishDate
            }
        });

        return res.status(200).json({ result: "OK" });

    } catch (error) {
        return res.status(400).json({ result: "NG" });
    }
});

//全ユーザーの貸出中の書籍一覧


router.get("/rental/current", isAdmin, async (req, res) => {
    try {
        // 全ユーザーの貸出中書籍を取得
        const rentalBooks = await prisma.rental.findMany({
            where: {
                returnDate: null // 未返却のものを対象にする
            },
            select: {
                id: true,
                userId: true,
                bookId: true,
                rentalDate: true,
                returnDeadline: true,
                users: {
                    select: {
                        name: true
                    }
                },
                books: {
                    select: {
                        title: true
                    }
                }
            }
        });

        // レスポンスデータの整形
        const formattedResponse = rentalBooks.map(rental => ({
            rentalId: rental.id,
            userId: rental.userId,
            userName: rental.users.name,
            bookId: rental.bookId,
            bookName: rental.books.title,
            rentalDate: rental.rentalDate,
            returnDeadline: rental.returnDeadline
        }));

        return res.status(200).json({
            rentalBooks: formattedResponse
        });

    } catch (error) {
        console.error("Error fetching current rentals:", error);
        return res.status(500).json({ error: "サーバーエラーが発生しました。" });
    }
});



// POST /admin/book/create
router.post('/book/create',
    isAdmin,
    async (req, res) => {
        try {
            const result = validationResult(req);

            // 現在の日時を取得
            const currentDate = new Date();

            // 修正：必要な変数をリクエストボディから取得
            const { isbn13, title, author, publishDate } = req.body;

            if (result.isEmpty()) {
                // 入力値に問題がなければ登録処理。問題があれば何もしない。

                // ログイン中のユーザー情報を取得
                const currentUser = req.user;

                // 修正：DateTimeを使用してデータベースに登録
                const createdBook = await prisma.books.create({
                    data: {
                        isbn13,
                        title,
                        author,
                        publishDate,
                    },
                });

                // 登録成功のレスポンスを返す
                res.status(201).json({ result: 'OK'});
            } else {
                // 入力値に問題がある場合はエラーレスポンスを返す
                res.status(400).json({ result: 'NG', error: 'Invalid input.' });
            }
        } catch (error) {
            console.error('Error during book creation:', error);
            // エラーが発生した場合はエラーレスポンスを返す
            res.status(500).json({ result: 'NG', error: 'Internal server error.' });
        }
    });

//特定のユーザーの貸出一覧

router.get("/rental/current/:uid", isAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.uid, 10);

        // 特定ユーザーの貸出中書籍を取得
        const userRentalBooks = await prisma.rental.findMany({
            where: {
                userId: userId,
                returnDate: null // 未返却のものを対象にする
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

        // 特定ユーザーの情報を取得
        const userInfo = await prisma.users.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                name: true
            }
        });

        // レスポンスデータの整形
        const formattedResponse = {
            userId: userInfo.id,
            userName: userInfo.name,
            rentalBooks: userRentalBooks.map(rental => ({
                rentalId: rental.id,
                bookId: rental.bookId,
                bookName: rental.books.title,
                rentalDate: rental.rentalDate,
                returnDeadline: rental.returnDeadline
            }))
        };

        return res.status(200).json(formattedResponse);

    } catch (error) {
        console.error("Error fetching user's current rentals:", error);
        return res.status(500).json({ error: "サーバーエラーが発生しました。" });
    }
});

module.exports = router;
