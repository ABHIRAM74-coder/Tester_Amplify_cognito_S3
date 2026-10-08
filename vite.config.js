import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                index: resolve(process.cwd(), "index.html"),
                upload: resolve(process.cwd(), "upload.html"),
                logout: resolve(process.cwd(), "logout.html")
            }
        }
    }
});