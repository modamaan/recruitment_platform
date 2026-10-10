import fs from "fs";
import FormData from "form-data";

async function testUpload() {
  const form = new FormData();
  form.append("resume", Buffer.from("dummy pdf content"), {
    filename: "test.pdf",
    contentType: "application/pdf",
  });

  try {
    const res = await fetch("http://localhost:8000/api/resume/parse", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (e) {
    console.error("Error:", e);
  }
}

testUpload();
