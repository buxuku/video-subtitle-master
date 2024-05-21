import crypto from "crypto";
import axios from "axios";

export default async function baidu(query, proof) {
  const { apiKey: appid, apiSecret: key } = proof || {};
  if (!appid || !key) {
    console.log("请先配置 API KEY 和 API SECRET");
    throw new Error("请先配置 API KEY 和 API SECRET");
  }
  const salt = new Date().getTime();
  const str1 = appid + query + salt + key;
  const sign = crypto.createHash("md5").update(str1).digest("hex");
  const data = {
    q: query,
    appid,
    salt,
    from: "en",
    to: "zh",
    sign,
  };
  const res = await axios.post(
    "https://fanyi-api.baidu.com/api/trans/vip/translate",
    data,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  return res?.data?.trans_result?.[0]?.dst || "";
}
