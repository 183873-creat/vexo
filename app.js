import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const grid = document.querySelector("#project-grid");
const workCount = document.querySelector("#work-count");
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");
let projects = [];

document.querySelector("#current-year").textContent = String(new Date().getFullYear());

function renderProjects() {
  workCount.textContent = `${projects.length} ${projects.length === 1 ? "مشروع" : "مشاريع"}`;
  grid.replaceChildren();

  if (projects.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = '<span class="empty-icon" aria-hidden="true">✳</span><h3>الحكاية تبدأ من هنا.</h3><p>نعمل على تجهيز أعمالنا الجديدة. عد قريباً لمشاهدة مشاريع VEXO.</p>';
    grid.append(empty);
    return;
  }

  projects.forEach((project, index) => {
    const card = document.createElement("article");
    card.className = "project-card";
    const media = document.createElement("div");
    media.className = "project-media";
    media.style.setProperty("--card-index", String(index));

    const video = document.createElement("video");
    video.src = project.videoUrl;
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    video.setAttribute("aria-label", `مشاهدة فيديو ${project.title}`);
    media.append(video);

    const details = document.createElement("div");
    details.className = "project-details";
    const title = document.createElement("h3");
    title.textContent = project.title;
    const description = document.createElement("p");
    description.textContent = project.description || "";
    details.append(title);
    if (project.description) details.append(description);
    card.append(media, details);
    grid.append(card);
  });
}

onSnapshot(
  query(collection(db, "projects"), orderBy("createdAt", "desc")),
  (snapshot) => {
    projects = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
    renderProjects();
  },
  (error) => {
    console.error("Could not load portfolio projects:", error);
    grid.innerHTML = '<div class="empty-state error-state"><span class="empty-icon" aria-hidden="true">!</span><h3>تعذّر تحميل الأعمال.</h3><p>تحقق من اتصال Firebase وقواعد Firestore ثم أعد تحميل الصفحة.</p></div>';
    workCount.textContent = "";
  },
);

menuToggle.addEventListener("click", () => {
  const expanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!expanded));
  navigation.classList.toggle("is-open", !expanded);
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
  });
});
