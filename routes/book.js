const express = require('express');
const router = express.Router();
const authMiddleware = require('./authMiddleware'); // パスはプロジェクトの実際のディレクトリ構造に合わせて変更する
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const loginCheck = (req, res, next) => {
    if (!req.user) {
        req.session.returnTo = "/book";
        res.redirect("/users/login");
        return;
    }
    next();
};


/**
 * メッセージ一覧ページ
 */
// router.get("/list?page=p", loginCheck, async (req, res, next) => {
//     try {
//         // ページ番号をパラメータから取る。なければデフォルトは 1
//         const page = +req.params.page || 1;
//
//         // メッセージ取ってくる
//         const messages = await prisma.message.findMany({
//             skip: (page - 1) * pageSize,
//             take: pageSize,
//             orderBy: [
//                 { createdAt: "desc" }
//             ],
//             include: {
//                 account: true
//             }
//         });
//
//         // JSON形式でクライアントに返す
//         res.status(200).json({ messages });
//     } catch (error) {
//         // エラーが発生した場合はエラーレスポンスを返す
//         res.status(500).json({ error: 'Error fetching messages' });
//     } finally {
//         await prisma.$disconnect();
//     }
// });

module.exports = router;