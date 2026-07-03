export async function sendWhatsAppMessage(apiKey: string, phone: string, message: string) {
  try {
    const form = new URLSearchParams();
    form.set("target", phone);
    form.set("message", message);
    form.set("countryCode", "62");

    await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
  } catch {
    // Notifikasi gagal kekirim gak boleh bikin proses pembayaran ikut gagal
  }
}
