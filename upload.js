
import { userManager } from "./main.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

const REGION = "ap-southeast-2";
const USER_POOL_ID = "ap-southeast-2_7ExIbmuT6";

const IDENTITY_POOL_ID =
  "ap-southeast-2:d90a2c51-8890-410a-ad3e-fbb62ffd6789";

const BUCKET_NAME = "familykit-documents-2026-2027";

const LOGIN_PROVIDER =
  `cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;

const fileInput = document.getElementById("fileInput");
const uploadButton = document.getElementById("uploadButton");
const uploadStatus = document.getElementById("uploadStatus");
const logoutButton = document.getElementById("logoutButton");
const welcomeMessage = document.getElementById("welcomeMessage");

let currentUser = null;

function showStatus(message) {
  if (uploadStatus) uploadStatus.textContent = message;
}

async function initializePage() {
  try {
    // Complete Cognito login after returning to upload.html
    if (new URLSearchParams(window.location.search).has("code")) {
      await userManager.signinRedirectCallback();
      window.history.replaceState({}, "", "/upload.html");
    }

    currentUser = await userManager.getUser();

    if (!currentUser || currentUser.expired || !currentUser.id_token) {
      window.location.replace("/");
      return;
    }

    if (welcomeMessage) {
      welcomeMessage.textContent =
        `Welcome, ${currentUser.profile.email || "FamilyKit user"}`;
    }

    showStatus("You can now select a document to upload.");
  } catch (error) {
    console.error("Authentication error:", error);
    showStatus("Authentication failed. Please log in again.");
  }
}

async function uploadFile() {
  const file = fileInput?.files?.[0];

  if (!file) {
    showStatus("Please select a file first.");
    return;
  }

  if (!currentUser || currentUser.expired || !currentUser.id_token) {
    showStatus("Your login has expired. Please log in again.");
    return;
  }

  const allowedExtensions = [
    "pdf", "doc", "docx", "jpg", "jpeg",
    "png", "xls", "xlsx", "ppt", "pptx"
  ];

  const extension = file.name.split(".").pop().toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    showStatus("This file type is not supported.");
    return;
  }

  uploadButton.disabled = true;
  showStatus("Uploading your document...");

  try {
    const credentials = fromCognitoIdentityPool({
      clientConfig: { region: REGION },
      identityPoolId: IDENTITY_POOL_ID,
      logins: {
        [LOGIN_PROVIDER]: currentUser.id_token
      }
    });

    const s3 = new S3Client({
      region: REGION,
      credentials
    });

    const userId = currentUser.profile.sub;
    const uniqueFileName = `${crypto.randomUUID()}-${file.name}`;

    const objectKey = `users/${userId}/${uniqueFileName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
        Body: file,
        ContentType: file.type || "application/octet-stream"
      })
    );

    showStatus(`Successfully uploaded: ${file.name}`);
    fileInput.value = "";

  } catch (error) {
    console.error("S3 upload error:", error);
    showStatus(`Upload failed: ${error.message}`);
  } finally {
    uploadButton.disabled = false;
  }
}

uploadButton?.addEventListener("click", uploadFile);

logoutButton?.addEventListener("click", async () => {
  try {
    await userManager.signoutRedirect();
  } catch (error) {
    console.error("Logout error:", error);
    showStatus("Unable to log out. Please try again.");
  }
});

initializePage();
