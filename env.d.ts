/*
 * @Author: baiwumm me@baiwumm.com
 * @Date: 2025-08-04 22:04:44
 * @LastEditors: baiwumm me@baiwumm.com
 * @LastEditTime: 2025-08-04 22:05:05
 * @FilePath: \SplitCat\env.d.ts
 * @Description:
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */
/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
