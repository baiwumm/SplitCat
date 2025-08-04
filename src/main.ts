/*
 * @Author: baiwumm me@baiwumm.com
 * @Date: 2025-08-04 20:59:33
 * @LastEditors: baiwumm me@baiwumm.com
 * @LastEditTime: 2025-08-04 21:41:01
 * @FilePath: \SplitCat\src\main.ts
 * @Description:
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./style.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount("#app");
