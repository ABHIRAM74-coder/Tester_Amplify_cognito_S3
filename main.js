
import { UserManager, WebStorageStateStore } from "oidc-client-ts";

const cognitoDomain =
  "https://ap-southeast-27exibmut6.auth.ap-southeast-2.amazoncognito.com";

const userPoolId = "ap-southeast-2_7ExIbmuT6";

// Copy the exact Client ID from Cognito → App clients
const clientId = "ng24ag0phg3kloh0j9bogijo1";

const websiteUrl =
  "https://master.d2iixgnsok84wh.amplifyapp.com";

export const userManager = new UserManager({
  authority: `https://cognito-idp.ap-southeast-2.amazonaws.com/${userPoolId}`,
  client_id: clientId,
  redirect_uri: `${websiteUrl}/upload.html`,
  post_logout_redirect_uri: `${websiteUrl}/logout.html`,
  response_type: "code",
  scope: "openid email",
  userStore: new WebStorageStateStore({
    store: window.sessionStorage
  }),
  metadata: {
    issuer: `https://cognito-idp.ap-southeast-2.amazonaws.com/${userPoolId}`,
    authorization_endpoint: `${cognitoDomain}/oauth2/authorize`,
    token_endpoint: `${cognitoDomain}/oauth2/token`,
    userinfo_endpoint: `${cognitoDomain}/oauth2/userInfo`,
    end_session_endpoint: `${cognitoDomain}/logout`
  }
});

document.getElementById("loginButton")?.addEventListener(
  "click",
  async () => {
    try {
      await userManager.signinRedirect();
    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to start login. Please try again.");
    }
  }
);
