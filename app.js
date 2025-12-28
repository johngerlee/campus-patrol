const SUPABASE_URL = "https://fkqcmxmmaktlpxfffzvi.supabase.co";
const SUPABASE_KEY = "sb_publishable_0vZuBMfRrzkHPe9XxrlqEw_treLpUrH";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let patrolPoint = "";
let latitude = "";
let longitude = "";

/* ===== QR Code 掃描 ===== */
const html5QrCode = new Html5Qrcode("reader");

html5QrCode.start(
  { facingMode: "environment" },
  { fps: 10, qrbox: 250 },
  (decodedText) => {
    patrolPoint = decodedText;
    document.getElementById("qrResult").innerText = decodedText;
    html5QrCode.stop();
    getGPS();
  }
);

/* ===== GPS 定位 ===== */
function getGPS() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
        document.getElementById("gpsInfo").innerText =
          `緯度：${latitude}，經度：${longitude}`;
      },
      () => alert("定位失敗，請確認定位權限")
    );
  }
}

/* ===== 巡邏 / 異常回報 ===== */
function submitReport() {
  const photo = document.getElementById("photo").files[0];
  const remark = document.getElementById("remark").value;

  if (!patrolPoint) {
    alert("尚未掃描巡邏點");
    return;
  }

  const formData = new FormData();
  formData.append("patrolPoint", patrolPoint);
  formData.append("latitude", latitude);
  formData.append("longitude", longitude);
  formData.append("remark", remark);
  if (photo) formData.append("photo", photo);

  fetch("/api/patrol/report", {
    method: "POST",
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    alert("巡邏紀錄已送出");
    location.reload();
  })
  .catch(() => alert("送出失敗"));
}

/* ===== 緊急求助 ===== */
function sendEmergency() {
  if (!confirm("是否立即發送緊急求助？")) return;

  fetch("/api/patrol/emergency", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patrolPoint,
      latitude,
      longitude
    })
  })
  .then(res => res.json())
  .then(() => alert("已發送緊急通知"))
  .catch(() => alert("緊急通知失敗"));
}

async function submitReport() {
  const photoFile = document.getElementById("photo").files[0];
  const remark = document.getElementById("remark").value;

  let photoUrl = "";

  if (photoFile) {
    const fileName = Date.now() + "_" + photoFile.name;

    const { data, error } = await supabase.storage
      .from("patrol-photos")
      .upload(fileName, photoFile);

    if (error) {
      alert("照片上傳失敗");
      return;
    }

    photoUrl = `${SUPABASE_URL}/storage/v1/object/public/patrol-photos/${fileName}`;
  }

  const { error } = await supabase.from("patrol_logs").insert([
    {
      patrol_point: patrolPoint,
      latitude,
      longitude,
      remark,
      photo_url: photoUrl
    }
  ]);

  if (error) {
    alert("資料寫入失敗");
  } else {
    alert("巡邏紀錄已成功上傳");
    location.reload();
  }
}

function sendEmergency() {
  window.location.href = "tel:0911750780";
}
