// api/bypass.js
import axios from 'axios';
import crypto from 'crypto';
import cheerio from 'cheerio';
import NodeCache from 'node-cache';

const headers = {
  Referer: "https://linkvertise.com/",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "Connection": "keep-alive",
};

const cache = new NodeCache({ stdTTL: 600 });

const md5 = (data) => crypto.createHash('md5').update(data).digest('hex');

const bypass = async (hwid) => {
  const hashedHwid = md5(hwid);

  const startUrl = `https://flux.li/android/external/start.php?HWID=${hwid}`;
  const check1Url = "https://flux.li/android/external/check1.php";
  const mainUrl = `https://flux.li/android/external/main.php`;

  try {
    const startResponse = await axios.post(startUrl, {}, { headers });
    if (startResponse.status !== 200) throw new Error(`Error in startUrl: ${startResponse.statusText}`);

    const check1Response = await axios.get(check1Url, { headers });
    if (check1Response.status !== 200) throw new Error(`Error in check1Url: ${check1Response.statusText}`);

    const mainResponse = await axios.get(mainUrl, { headers });
    if (mainResponse.status !== 200) throw new Error(`Error in mainUrl: ${mainResponse.statusText}`);

    const text = mainResponse.data;
    const $ = cheerio.load(text);
    const extractedKey = $("body > main > code").text().trim();

    if (extractedKey === hashedHwid) {
      return `Success:\nKey: ${hashedHwid}`;
    } else {
      return `Error: Nuh Uhh`;
    }
  } catch (error) {
    const cachedError = cache.get(error.config.url);
    if (cachedError) {
      return cachedError;
    }
    let message;

    if (error.response) {
      message = `Request error: ${error.response.status} - ${error.response.statusText}`;
    } else if (error.request) {
      message = `No response received - ${error.request}`;
    } else {
      message = `Error: ${error.message}`;
    }
    cache.set(error.config.url, message);
    return message;
  }
};

export default async (req, res) => {
  const hwid = req.query.hwid; // Get the HWID from the query parameters

  if (!hwid) {
    res.status(400).send('Error: No HWID provided');
    return;
  }

  try {
    const result = await bypass(hwid);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};
