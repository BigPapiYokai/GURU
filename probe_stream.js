const consumerKey = "GpvJT2Y1M3y87VYynIpFnEY1V";
const consumerSecret = "F5RZmZbkyyOXI449sX8TxWry4OomnLz43Tl85JiYQgB325vu29";
const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

(async () => {
  try {
    // Get token
    const tokenRes = await fetch("https://api.twitter.com/oauth2/token", {
      method: "POST",
      headers: { "Authorization": `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: "grant_type=client_credentials",
    });
    const tokenData = await tokenRes.json();
    const bearer = tokenData.access_token;
    
    // Add streaming rules for Trump and Musk by username
    const rulesRes = await fetch("https://api.twitter.com/2/tweets/search/stream/rules", {
      method: "POST",
      headers: { "Authorization": `Bearer ${bearer}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        add: [
          { value: "from:realDonaldTrump", tag: "trump" },
          { value: "from:elonmusk", tag: "musk" },
        ]
      })
    });
    console.log("Rules setup:", rulesRes.status);
    console.log("Rules response:", await rulesRes.text());
    
    // Connect to stream with rules
    const streamRes = await fetch("https://api.twitter.com/2/tweets/search/stream?tweet.fields=author_id,created_at,text,entities", {
      headers: { "Authorization": `Bearer ${bearer}` },
    });
    console.log("Stream connected! Status:", streamRes.status);
    console.log("✅ Real-time streaming available!");
    
    // Read first chunk
    const chunk = await streamRes.text();
    console.log("First chunk:", chunk.slice(0, 300));
  } catch (e) {
    console.log("Error:", e.message);
  }
})();