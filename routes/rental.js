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
            return res.status(409).json({ error: "指定された書籍はすでに貸出中です。" });
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

        return res.status(201).json({
            status: "success",
            message: "貸出が成功しました。",
            rental: createdRental
        });

    } catch (error) {
        console.error("Error starting rental:", error);
        return res.status(400).json({ error: "その他のエラーが発生しました。" });
    }
});

module.exports = router;