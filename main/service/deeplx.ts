import axios from "axios";
export default async function deeplx(query, proof) {
  const { apiKey: apiUrl1, apiSecret: apiUrl2 } = proof || {};
  try {
    const res = await axios.post(apiUrl1, {
      text: query,
      source_lang: "en", 
      target_lang: "zh",
    });
    return res?.data?.alternatives?.[0] || "";
  } catch (error) {
    try {
      const res = await axios.post(apiUrl2, {
        text: query,
        source_lang: "en",
        target_lang: "zh", 
      });
      return res?.data?.alternatives?.[0] || "";
    } catch (error) {
      return "error";
    }
  }
}
