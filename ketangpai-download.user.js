// ==UserScript==
// @name         课堂派资料下载
// @namespace    ketangpai-download
// @version      0.2.0
// @description  在电脑版课程资料列表中添加下载和新标签页打开链接
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

  function enhance() {
    for (const card of document.querySelectorAll('.card-layout-box')) {
      if (card.querySelector(`.${LINK_CLASS}`)) continue;

      const vm = card.__vue__;
      const data = vm?.cardValue;
      if (!data?.id || Number(data.contenttype) !== 2) continue;

      const query = vm.$route?.query || {};
      const courseId = vm.courseid || query.courseid;
      const content = card.querySelector('.layout-right-info');
      if (!courseId || !content) continue;

      const detailQuery = {
        courseid: courseId,
        id: data.id,
        courserole: vm.courserole ?? query.courserole ?? '0',
        type: data.contenttype
      };
      if (vm.showType) detailQuery.showType = vm.showType;

      const detail = vm.$router.resolve({
        path: '/main/resource_detail',
        query: detailQuery
      });

      const actions = document.createElement('div');
      actions.className = LINK_CLASS;
      actions.style.cssText =
        'display:flex;flex-wrap:wrap;gap:12px;margin-top:8px';
      actions.append(createLink('新标签页打开', detail.href));

      if (String(data.candownload) === '1') {
//      if (true) {
        const files = data.attachment || [];

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