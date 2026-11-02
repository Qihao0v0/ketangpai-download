# ketangpai-download
[![License: GPL v3](https://img.shields.io/badge/license-GPLv3-blue)](LICENSE)

使得**电脑端课堂派**课件在目录就可以下载，节省时间。

## 如何使用
打开[**电脑端课堂派**](https://www.ketangpai.com/#/main)，登录，进入你需要下载课件的课程的资料分页。

随后你有两个选择：

1. 下载`ketangpai-download.user.js`，作为油猴脚本加载：[安装油猴脚本](https://github.com/Qihao0v0/ketangpai-download/raw/refs/heads/main/ketangpai-download.user.js)

2. 复制这段代码，黏贴到F12-控制台中：
```javascript
fetch('https://gh-proxy.com/https://raw.githubusercontent.com/Qihao0v0/ketangpai-download/main/ketangpai-download.user.js').then(r => r.text()).then(c => (0, eval)(c));
```

3. 直接复制这段代码，黏贴到F12-控制台中：
```javascript
// ==UserScript==
// @name         课堂派资料下载
// @namespace    ketangpai-download
// @version      0.3.0
// @description  在电脑版课程列表中为资料和互动课件添加下载及新标签页打开入口
// @match        https://www.ketangpai.com/*
// @grant        none
// @run-at       document-idle
// @license      GPL-3.0-only
// ==/UserScript==

// Copyright (C) 2026 Qihao
//
// SPDX-License-Identifier: GPL-3.0-only

(() => {
  'use strict';

  const INSTANCE = '__ketangpaiDownload';
  const LINK_CLASS = 'ketangpai-download';
  const BYPASS_CANDOWNLOAD = false;

  window[INSTANCE]?.();
  document.querySelectorAll(`.${LINK_CLASS}`).forEach(el => el.remove());

  function createLink(text, href, filename) {
    const url = new URL(href, location.href);
    if (!['http:', 'https:'].includes(url.protocol)) return null;

    const link = document.createElement('a');
    link.textContent = text;
    link.href = url.href;
    link.target = '_blank';
    link.rel = 'noopener';
    link.style.cssText = 'color:#4285f4;font-size:13px';
    if (filename) link.download = filename;

    for (const event of ['click', 'dblclick']) {
      link.addEventListener(event, e => e.stopPropagation());
    }

    return link;
  }

  function createDownloadButton(vm) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = '下载课件';
    button.style.cssText =
      'padding:0;border:0;background:none;color:#4285f4;' +
      'font-size:13px;cursor:pointer';

    button.addEventListener('dblclick', e => e.stopPropagation());
    button.addEventListener('click', async e => {
      e.stopPropagation();
      if (button.disabled) return;

      button.disabled = true;
      try {
        await vm.onDownload();
      } catch (error) {
        console.error('[课堂派资料下载]', error);
        vm.$message?.error('下载失败，请稍后重试');
      } finally {
        button.disabled = false;
      }
    });

    return button;
  }

  function enhance() {
    for (const card of document.querySelectorAll('.card-layout-box')) {
      if (card.querySelector(`.${LINK_CLASS}`)) continue;

      const vm = card.__vue__;
      const data = vm?.cardValue;
      const type = Number(data?.contenttype);
      if (!data?.id || ![1, 2].includes(type)) continue;

      const query = vm.$route?.query || {};
      const courseId = vm.courseid || query.courseid;
      const role = vm.courserole ?? query.courserole ?? '0';
      const content = card.querySelector('.layout-right-info');
      if (!courseId || !content) continue;

      const files = data.attachment || [];
      const isStudent = String(role) === '0';

      const route = type === 1
        ? {
            path: isStudent ? '/coursewareStudy' : '/main/interactive',
            query: {
              interactid: data.id,
              courseid: courseId,
              courserole: role,
              ...(isStudent
                ? { filename: files[0]?.name || data.title || '' }
                : { name: 'classware', type: '0' })
            }
          }
        : {
            path: '/main/resource_detail',
            query: {
              courseid: courseId,
              id: data.id,
              courserole: role,
              type: data.contenttype
            }
          };

      if (vm.showType) route.query.showType = vm.showType;

      const detail = vm.$router.resolve(route);
      const actions = document.createElement('div');
      actions.className = LINK_CLASS;
      actions.style.cssText =
        'display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-top:8px';
      actions.append(createLink('新标签页打开', detail.href));

      if (type === 1 && typeof vm.onDownload === 'function') {
        actions.append(createDownloadButton(vm));
      }

      if (type === 2 && (String(data.candownload) === '1' || BYPASS_CANDOWNLOAD === true)) {
        for (const [index, file] of files.entries()) {
          if (!file.url) continue;

          const text = files.length > 1
            ? `下载附件 ${index + 1}`
            : '下载';
          const link = createLink(text, file.url, file.name);
          if (link) actions.append(link);
        }
      }

      content.append(actions);
    }
  }

  let timer;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(enhance, 150);
  });

  window[INSTANCE] = () => {
    observer.disconnect();
    clearTimeout(timer);
  };

  enhance();
  observer.observe(document.body, { childList: true, subtree: true });
})();
```

## Q&A
Q：有支持[移动端课堂派](https://w.ketangpai.com)（[w.ketangpai.com](https://w.ketangpai.com)）的计划吗

A：暂时没有。

Q：有支持课堂派小程序的计划吗

A：没有。

Q：课件不允许下载怎么办？

A：这真是个好问题！或许*已经存在绕过方案*也说不定呢？