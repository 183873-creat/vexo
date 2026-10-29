import { auth, db, storage } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const loginPanel = document.querySelector("#login-panel");
const dashboard = document.querySelector("#admin-dashboard");
const notice = document.querySelector("#admin-notice");
const loginForm = document.querySelector("#login-form");
const projectForm = document.querySelector("#project-form");
const projectList = document.querySelector("#admin-project-list");
const totalLabel = document.querySelector("#admin-total");
const uploadProgress = document.querySelector("#upload-progress");
const uploadProgressLabel = document.querySelector("#upload-progress-label");
const loginButton = loginForm.querySelector('button[type="submit"]');
const uploadButton = projectForm.querySelector('button[type="submit"]');
const maxVideoSize = 250 * 1024 * 1024;
const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];
let unsubscribeProjects;

function showNotice(message, type = "error") {
  notice.textContent = message;
  notice.className = `admin-notice ${type === "success" ? "notice-success" : "notice-error"}`;
  notice.hidden = false;
}

function firebaseMessage(error) {
  const serverResponse = error.customData?.serverResponse;
  const responseDetails = typeof serverResponse === "string"
    ? serverResponse.trim().slice(0, 500)
    : "";
  const messages = {
    "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    "auth/invalid-email": "صيغة البريد الإلكتروني غير صحيحة.",
    "auth/too-many-requests": "محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.",
    "auth/network-request-failed": "تعذّر الاتصال. تحقق من اتصال الإنترنت.",
    "permission-denied": "ليس لديك صلاحية لهذا الإجراء. تحقق من بريد المدير في قواعد Firebase.",
    "storage/bucket-not-found": `حاوية Firebase Storage غير موجودة. تحقق من إعداد Storage واسم الحاوية في firebase.js (حاليّاً: ${storage.app.options.storageBucket}).`,
    "storage/unauthenticated": "انتهت جلسة الدخول. سجّل الخروج ثم ادخل مجدداً.",
    "storage/unauthorized": "ليس لديك صلاحية رفع أو حذف الملفات. تحقق من قواعد Firebase Storage.",
    "storage/canceled": "تم إلغاء رفع الملف.",
    "storage/retry-limit-exceeded": "انقطع الاتصال أثناء الرفع. حاول مجدداً.",
  };
  if (error.code === "storage/unknown") {
    const guidance = `تعذّر على Firebase Storage إكمال الرفع. تحقق من تفعيل Storage وإنشاء الحاوية (${storage.app.options.storageBucket})، ومن ربط الفوترة إذا طلب Firebase ذلك، ثم نشر storage.rules بعد استبدال REPLACE_WITH_ADMIN_EMAIL ببريد المدير.`;
    return `${guidance}${responseDetails ? ` رد الخادم: ${responseDetails}` : ""}`;
  }
  return messages[error.code] || `تعذّر إكمال العملية: ${error.message || error.code || "خطأ غير معروف"}${responseDetails ? ` رد الخادم: ${responseDetails}` : ""}`;
}

function watchProjects() {
  if (unsubscribeProjects) unsubscribeProjects();
  unsubscribeProjects = onSnapshot(
    query(collection(db, "projects"), orderBy("createdAt", "desc")),
    (snapshot) => {
      totalLabel.textContent = `${snapshot.size} ${snapshot.size === 1 ? "مشروع" : "مشاريع"}`;
      projectList.replaceChildren();
      if (snapshot.empty) {
        const empty = document.createElement("p");
        empty.className = "empty-admin";
        empty.textContent = "لا توجد مشاريع بعد. أضف أول فيديو إلى المعرض.";
        projectList.append(empty);
        return;
      }

      snapshot.docs.forEach((projectDocument) => {
        const project = projectDocument.data();
        const row = document.createElement("article");
        row.className = "admin-project";
        const preview = document.createElement("div");
        preview.className = "admin-project-preview";
        preview.textContent = "▶";
        const info = document.createElement("div");
        info.className = "admin-project-info";
        const heading = document.createElement("h3");
        heading.textContent = project.title;
        info.append(heading);
        const removeButton = document.createElement("button");
        removeButton.className = "delete-button";
        removeButton.type = "button";
        removeButton.textContent = "حذف";
        removeButton.setAttribute("aria-label", `حذف مشروع ${project.title}`);
        removeButton.addEventListener("click", () => removeProject(projectDocument.id, project));
        row.append(preview, info, removeButton);
        projectList.append(row);
      });
    },
    (error) => showNotice(firebaseMessage(error)),
  );
}

async function uploadFile(file, path) {
  const fileReference = ref(storage, path);
  const task = uploadBytesResumable(fileReference, file, { contentType: file.type });
  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        uploadProgress.querySelector("span").style.width = `${percent}%`;
        uploadProgressLabel.textContent = `جارٍ رفع الملفات... ${percent}%`;
      },
      (error) => {
        console.error("Firebase Storage upload failed:", {
          code: error.code,
          message: error.message,
          serverResponse: error.customData?.serverResponse,
          customData: error.customData,
        });
        reject(error);
      },
      async () => {
        try {
          resolve({ path, url: await getDownloadURL(task.snapshot.ref) });
        } catch (error) {
          reject(error);
        }
      },
    );
  });
}

async function removeProject(projectId, project) {
  if (!window.confirm(`هل تريد حذف "${project.title}" نهائياً؟`)) return;
  const button = [...projectList.querySelectorAll(".delete-button")].find((item) => item.getAttribute("aria-label") === `حذف مشروع ${project.title}`);
  if (button) button.disabled = true;
  try {
    await deleteDoc(doc(db, "projects", projectId));
    const filePaths = [project.videoPath, project.coverPath].filter(Boolean);
    const results = await Promise.allSettled(filePaths.map((path) => deleteObject(ref(storage, path))));
    const failedCleanup = results.some((result) => result.status === "rejected");
    showNotice(
      failedCleanup
        ? "حُذف المشروع من المعرض، لكن تعذّر حذف أحد ملفاته من Storage. تحقق من صلاحيات التخزين."
        : "تم حذف المشروع وملفاته بنجاح.",
      failedCleanup ? "error" : "success",
    );
  } catch (error) {
    showNotice(firebaseMessage(error));
    if (button) button.disabled = false;
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginButton.disabled = true;
  notice.hidden = true;
  const formData = new FormData(loginForm);
  try {
    await signInWithEmailAndPassword(auth, formData.get("email"), formData.get("password"));
  } catch (error) {
    showNotice(firebaseMessage(error));
  } finally {
    loginButton.disabled = false;
  }
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    showNotice(firebaseMessage(error));
  }
});

projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(projectForm);
  const video = formData.get("video");
  if (!(video instanceof File) || video.size === 0) {
    showNotice("اختر ملف فيديو قبل الإضافة.");
    return;
  }
  if (!allowedVideoTypes.includes(video.type)) {
    showNotice("صيغة الفيديو غير مدعومة. اختر MP4 أو WebM أو MOV.");
    return;
  }
  if (video.size > maxVideoSize) {
    showNotice("حجم الفيديو يتجاوز الحد المسموح (250MB).");
    return;
  }
  uploadButton.disabled = true;
  uploadProgress.hidden = false;
  notice.hidden = true;
  let uploadedPaths = [];
  try {
    const projectId = crypto.randomUUID();
    const videoAsset = await uploadFile(video, `projects/${projectId}/video-${crypto.randomUUID()}`);
    uploadedPaths.push(videoAsset.path);

    await addDoc(collection(db, "projects"), {
      title: String(formData.get("title")).trim(),
      description: String(formData.get("description")).trim(),
      videoUrl: videoAsset.url,
      videoPath: videoAsset.path,
      createdAt: new Date(),
    });
    projectForm.reset();
    showNotice("تم رفع المشروع وإضافته إلى المعرض.", "success");
  } catch (error) {
    const cleanupResults = await Promise.allSettled(uploadedPaths.map((path) => deleteObject(ref(storage, path))));
    const cleanupFailed = cleanupResults.some((result) => result.status === "rejected");
    showNotice(`${firebaseMessage(error)}${cleanupFailed ? " تعذّر حذف ملف مرفوع جزئياً؛ تحقق من Storage." : ""}`);
  } finally {
    uploadButton.disabled = false;
    uploadProgress.hidden = true;
  }
});

onAuthStateChanged(auth, (user) => {
  loginPanel.hidden = Boolean(user);
  dashboard.hidden = !user;
  if (user) {
    watchProjects();
  } else if (unsubscribeProjects) {
    unsubscribeProjects();
    unsubscribeProjects = undefined;
  }
});
