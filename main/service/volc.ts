import { Service } from "@volcengine/openapi";

let service;
let fetchApi;

export default async function translate(query, proof) {
  const { apiKey: accessKeyId, apiSecret: secretKey } = proof || {};
  if (!accessKeyId || !secretKey) {
    console.log("请先配置 API KEY 和 API SECRET");
    throw new Error("请先配置 API KEY 和 API SECRET");
  }
  if (!service || !fetchApi) {
    service = new Service({
      host: "open.volcengineapi.com",
      serviceName: "translate",
      region: "cn-north-1",
      accessKeyId,
      secretKey,
    });
    fetchApi = service.createAPI("TranslateText", {
      Version: "2020-06-01",
      method: "POST",
      contentType: "json",
    });
  }
  const postBody = {
    SourceLanguage: "en",
    TargetLanguage: "zh",
    TextList: [query],
  };
  try {
    const res = await fetchApi(postBody, {});
    return res.TranslationList?.[0]?.Translation;
  } catch (error) {
    return "error";
  }
}
