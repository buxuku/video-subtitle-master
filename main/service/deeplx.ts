import axios from "axios";
export default async function deeplx(query) {
  try {
    const res = await axios.post("http://localhost:1188/translate", {
      text: query,
      source_lang: "en",
      target_lang: "zh",
    });
    return res?.data?.alternatives?.[0] || "";
  } catch (error) {
    return "error";
  }
}
