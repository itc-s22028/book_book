const passport = require("passport");
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { validationResult, check } = require('express-validator');
const { calcHash, generateSalt } = require('../util/auth')



const prisma = new PrismaClient();



/**
 * ユーザ認証
 */
router.post("/login", passport.authenticate("local", {
  failWithError: true // passport によるログインに失敗したらエラーを発生させる
}), (req, res, next) => {
  // ここに来れるなら、ログインは成功していることになる。
  res.json({
    message: "OK"
  });
});

router.get("/login", (req, res) => {
  res.render("login");
  res.redirect(`/book?username=${username}`);
});

/**
 * ユーザ新規作成
 */
router.post("/register", [
  // 入力値チェックミドルウェア
  check("email").notEmpty({ ignore_whitespace: true }),
  check("name").notEmpty({ ignore_whitespace: true }),
  check("password").notEmpty({ ignore_whitespace: true })
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, name, password } = req.body;
  const salt = generateSalt();
  const hashed = calcHash(password, salt);

  try {
    await prisma.users.create({
      data: {
        email,
        name,
        password: hashed,
        salt: salt
      }
    });
    return res.status(201).json({ message: "created!" });
  } catch (e) {
    switch (e.code) {
      case "P2002":
        return res.status(400).json({ message: "username is already registered" });
      default:
        console.error(e);
        return res.status(500).json({ message: "unknown error" });
    }
  }
});

router.get("/register", (req, res) => {
  res.render("signup"); // ユーザ登録ページを表示するための処理を追加する
});

// ログアウト
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ result: 'NG', error: 'ログアウト中にエラーが発生しました。' });
    }
    res.status(200).json({ result: 'OK' });
  });
});

// ログイン状態チェック
const admincheck = async (req, res, next) => {
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
      req.isAdmin = true;
      next();
    } else {
      req.isAdmin = false;
      next();
    }
  } catch (error) {
    console.error('Error during isAdmin check:', error);
    // エラーが発生した場合はエラーレスポンスを返す
    res.status(500).json({ result: 'NG', error: 'Internal server error.' });
  }
};

router.get('/check', admincheck, (req, res) => {
  if (req.isAuthenticated()) {
    // ログイン中の場合
    return res.status(200).json({ result: 'OK', isAdmin: req.isAdmin });
  } else {
    // ログインしていない場合
    return res.status(401).json({ result: 'NG' });
  }
});



module.exports = router;