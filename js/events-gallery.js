import { supabase } from "./supabase.js";

const BUCKET = "urwa-events";

const COLLECTIONS = [
  { id: "day-of-arafah", title: "Day of Arafah", description: "Community connection and reminders around this blessed day." },
  { id: "eid-celebrations", title: "Eid Celebrations", description: "Gathering in gratitude, sisterhood and shared joy." },
  { id: "memorise-and-rise", title: "Memorise and Rise", description: "A Qur’an-focused initiative encouraging memorisation and perseverance." },
  { id: "retreats", title: "Retreats", description: "Retreats and time set aside for reflection, learning and connection." },
  { id: "dawah-and-outreach", title: "Da’wah and Outreach", description: "Community outreach and opportunities to share beneficial knowledge." },
  { id: "ramadan-initiatives", title: "Ramadan Initiatives", description: "Ramadan feeding, sadaqah initiatives and fundraising activities." },
  { id: "umrah-journeys", title: "Umrah Journeys", description: "Community journeys and spiritual opportunities when organised." },
  { id: "tea-tales-and-tadabbur", title: "Tea Tales and Tadabbur", description: "Monthly get-togethers, reflection and inter-halaqa connection." },
  { id: "quran-competitions", title: "Qur’an Competitions", description: "Activities that encourage revision, recitation and healthy motivation." }
];

const $ = id => document.getElementById(id);
const collectionGrid = $("collectionGrid");
const totalMediaCount = $("totalMediaCount");
const galleryStatus = $("galleryStatus");
const collectionDialog = $("collectionDialog");
const collectionDialogTitle = $("collectionDialogTitle");
const collectionDialogDescription = $("collectionDialogDescription");
const mediaGrid = $("mediaGrid");
const viewerDialog = $("viewerDialog");
const viewerTitle = $("viewerTitle");
const viewerContent = $("viewerContent");
const viewerCaption = $("viewerCaption");
const mediaByCollection = new Map();

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[c]);
}

function readableFileName(name = "") {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim()
    .replace(/\b\w/g, c => c.toUpperCase()) || "URWA memory";
}

function isVideo(file) {
  const mime = file.metadata?.mimetype || "";
  return mime.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name || "");
}

function isImage(file) {
  const mime = file.metadata?.mimetype || "";
  return mime.startsWith("image/") || /\.(jpe?g|png|webp|gif|avif)$/i.test(file.name || "");
}

function publicUrl(path) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function setStatus(message, error = false) {
  galleryStatus.textContent = message;
  galleryStatus.classList.toggle("error", error);
  galleryStatus.hidden = !message;
}

function filesFor(id) {
  return mediaByCollection.get(id) || [];
}

function coverMarkup(collection, files) {
  const first = files.find(isImage) || files.find(isVideo);
  if (!first) {
    return `<div class="collection-cover"><div class="collection-cover-fallback">${escapeHtml(collection.title)}</div><span class="cover-count">0 items</span></div>`;
  }
  const url = publicUrl(`${collection.id}/${first.name}`);
  const preview = isVideo(first)
    ? `<video src="${escapeHtml(url)}" muted playsinline preload="metadata"></video>`
    : `<img src="${escapeHtml(url)}" alt="${escapeHtml(collection.title)} event memory" loading="lazy">`;
  return `<div class="collection-cover">${preview}<span class="cover-count">${files.length} ${files.length === 1 ? "item" : "items"}</span></div>`;
}

function renderCollections() {
  const total = [...mediaByCollection.values()].reduce((sum, files) => sum + files.length, 0);
  totalMediaCount.textContent = `${total} ${total === 1 ? "memory" : "memories"}`;

  collectionGrid.innerHTML = COLLECTIONS.map(collection => {
    const files = filesFor(collection.id);
    return `<button class="collection-card" type="button" data-collection="${escapeHtml(collection.id)}" aria-label="Open ${escapeHtml(collection.title)} collection, ${files.length} media items">
      ${coverMarkup(collection, files)}
      <span class="collection-info"><h4>${escapeHtml(collection.title)}</h4><p>${escapeHtml(collection.description)}</p><span class="collection-open">Explore collection <span aria-hidden="true">→</span></span></span>
    </button>`;
  }).join("");
}

async function loadCollection(collection) {
  const { data, error } = await supabase.storage.from(BUCKET).list(collection.id, {
    limit: 100, offset: 0, sortBy: { column: "name", order: "asc" }
  });
  if (error) throw error;

  return (data || [])
    .filter(file => file.name && file.name !== ".emptyFolderPlaceholder")
    .filter(file => isImage(file) || isVideo(file))
    .map(file => ({
      ...file,
      collectionId: collection.id,
      path: `${collection.id}/${file.name}`,
      url: publicUrl(`${collection.id}/${file.name}`)
    }));
}

function renderMediaDialog(title, description, files) {
  collectionDialogTitle.textContent = title;
  collectionDialogDescription.textContent = description;
  mediaGrid.innerHTML = "";

  if (!files.length) {
    mediaGrid.innerHTML = `<div class="empty-gallery">This collection is ready for its memories. Photographs and videos will appear here once they have been added to the URWA Events folder in Supabase Storage.</div>`;
    return;
  }

  mediaGrid.innerHTML = files.map((file, index) => {
    const caption = readableFileName(file.name);
    const preview = isVideo(file)
      ? `<video src="${escapeHtml(file.url)}" muted playsinline preload="metadata"></video><span class="media-play" aria-hidden="true">▶</span>`
      : `<img src="${escapeHtml(file.url)}" alt="${escapeHtml(caption)}" loading="lazy">`;
    return `<button class="media-item" type="button" data-media-index="${index}"><span class="media-thumb">${preview}</span><span class="media-caption">${escapeHtml(caption)}</span></button>`;
  }).join("");

  mediaGrid.querySelectorAll("[data-media-index]").forEach(button => {
    button.addEventListener("click", () => {
      const file = files[Number(button.dataset.mediaIndex)];
      if (file) openViewer(file);
    });
  });
}

function openCollection(id) {
  const collection = COLLECTIONS.find(item => item.id === id);
  if (!collection) return;
  renderMediaDialog(collection.title, collection.description, filesFor(id));
  collectionDialog.showModal();
}

function openViewer(file) {
  viewerTitle.textContent = readableFileName(file.name);
  viewerCaption.textContent = readableFileName(file.name);
  viewerContent.replaceChildren();

  if (isVideo(file)) {
    const video = document.createElement("video");
    video.src = file.url;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = "metadata";
    viewerContent.appendChild(video);
  } else {
    const image = document.createElement("img");
    image.src = file.url;
    image.alt = readableFileName(file.name);
    viewerContent.appendChild(image);
  }
  viewerDialog.showModal();
}

function openAllMemories() {
  const all = COLLECTIONS.flatMap(collection => filesFor(collection.id));
  renderMediaDialog("All URWA Memories", "Photographs and videos from all available URWA event collections.", all);
  collectionDialog.showModal();
}

function setupDialogs() {
  document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
      const dialog = $(button.dataset.close);
      if (dialog?.open) dialog.close();
    });
  });

  [collectionDialog, viewerDialog].forEach(dialog => {
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });
  });

  viewerDialog.addEventListener("close", () => {
    const video = viewerContent.querySelector("video");
    if (video) video.pause();
    viewerContent.replaceChildren();
  });
}

async function initialiseGallery() {
  setupDialogs();
  collectionGrid.addEventListener("click", event => {
    const card = event.target.closest("[data-collection]");
    if (card) openCollection(card.dataset.collection);
  });
  $("viewAllMemories").addEventListener("click", openAllMemories);

  try {
    const results = await Promise.all(COLLECTIONS.map(async collection => ({
      id: collection.id,
      files: await loadCollection(collection)
    })));
    results.forEach(result => mediaByCollection.set(result.id, result.files));
    renderCollections();

    const total = [...mediaByCollection.values()].reduce((sum, files) => sum + files.length, 0);
    setStatus(total === 0
      ? "Your event collections are connected. Add photographs and videos to the matching folders in the “urwa-events” Supabase Storage bucket and they will appear here automatically."
      : "");
  } catch (error) {
    console.error("URWA event gallery could not load:", error);
    collectionGrid.innerHTML = COLLECTIONS.map(collection => `<button class="collection-card" type="button" data-collection="${escapeHtml(collection.id)}"><div class="collection-cover"><div class="collection-cover-fallback">${escapeHtml(collection.title)}</div></div><span class="collection-info"><h4>${escapeHtml(collection.title)}</h4><p>${escapeHtml(collection.description)}</p><span class="collection-open">Explore collection →</span></span></button>`).join("");
    totalMediaCount.textContent = "Gallery not connected";
    setStatus("The event gallery could not connect to Supabase Storage. Check that the “urwa-events” bucket exists, is public, and allows visitors to list its files. The page layout is still available.", true);
  }
}

initialiseGallery();