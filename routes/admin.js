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

module.exports = router;
