import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    DATABASE_URL: process.env.DATABASE_URL || "環境変数が読み込まれていません",
    JWT_SECRET: process.env.JWT_SECRET || "環境変数が読み込まれていません",
  });
}

  