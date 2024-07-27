var tabCountMethod;

async function getDisplayStyleOption() {
    let result = await browser.storage.local.get(['displayStyleOption']);
    if (result.displayStyleOption === "compactView") {
        tabCountMethod = 2;
    } else {
        tabCountMethod = 1;
    }
}

// Check if we have already set the display style option or just use the default
getDisplayStyleOption();

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

// Register the addon with TST
const registerToTST = async () => {
  try {
    // Base CSS to include with updates
    const baseCSS = `
      .newtab-button::after {
        display: none;
      }
    
      .newtab-button {
        height: auto;
        display: contents;
      }

      .newtab-button .extra-items-container {
        height: auto;
        display: contents;
        align-items: left;
      }

      .newtab-button-box {
        height: auto;
      }
    `;

    // CSS to change vertical location of the newtab button caret
    const caretCSS = `.after-tabs button.newtab-action-selector-anchor::after { margin-top: 0.3rem;)`;

    // Combine the base CSS with the new height CSS
    const combinedCSS = baseCSS + caretCSS;

    // Send a synchronus message to TST to register the addon and adjust the new tab button height
    await browser.runtime.sendMessage('treestyletab@piro.sakura.ne.jp', {
      type: 'register-self',
      name: 'TST Active and Total Tabs Counter',
      style: combinedCSS,
      listeningTypes: ['ready', 'tabbar-updated', 'sidebar-show']
    });

  } catch (e) {
    console.error('Failed to communicate with TST', e);
    await sleep(250).then(registerToTST);
  }
  
  let result2 = await browser.storage.local.get(['displayStyleOption']);
  if (result2.displayStyleOption === "compactView") {
      tabCountMethod = 2;
  } else {
      await browser.storage.local.set({displayStyleOption: "oneLinePerWindow"});
      tabCountMethod = 1;
  }

  // Update the tab count CSS after registering with TST
  updateTabCount();
};

async function getDisplayOption() {
  const { displayOption } = await browser.storage.local.get('displayOption');
  return displayOption || 'nativeBadge'; // Default to 'nativeBadge' if not set
}

// Function to render the badge using SVG
function svgRenderBadge(tabCount) {
  const svgIconBase = `
    <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0 C6.875 0.875 6.875 0.875 8 2 C8.07313567 4.53049402 8.09247527 7.03304837 8.0625 9.5625 C8.05798828 10.27341797 8.05347656 10.98433594 8.04882812 11.71679688 C8.03700864 13.47790013 8.01907263 15.23896036 8 17 C10.64 17 13.28 17 16 17 C16.12375 15.865625 16.2475 14.73125 16.375 13.5625 C16.684375 11.7990625 16.684375 11.7990625 17 10 C20.0832635 8.45836825 22.60878099 8.70252465 26 9 C27.9375 10.75 27.9375 10.75 29 13 C29 14.32 29 15.64 29 17 C31.97 17 34.94 17 38 17 C37.95875 16.05125 37.9175 15.1025 37.875 14.125 C38 11 38 11 40 9 C45.18358531 8.42404608 45.18358531 8.42404608 48 9 C50.45321644 11.83653151 51 13.25123496 51 17 C66.51 17 82.02 17 98 17 C98 12.38 98 7.76 98 3 C98.99 2.01 99.98 1.02 101 0 C104.625 0.1875 104.625 0.1875 108 1 C109.69167828 4.38335656 109.12870768 8.2268801 109.11352539 11.94775391 C109.11367142 12.87463516 109.11381744 13.80151642 109.1139679 14.75648499 C109.11326946 17.8298677 109.10548027 20.90319033 109.09765625 23.9765625 C109.09579182 26.10362719 109.09436804 28.2306923 109.09336853 30.35775757 C109.08954528 35.96375712 109.07971662 41.56973088 109.06866455 47.17572021 C109.0584463 52.89318493 109.05387002 58.61065379 109.04882812 64.328125 C109.0380942 75.55209468 109.02102007 86.7760452 109 98 C109.78761719 98.1340625 110.57523437 98.268125 111.38671875 98.40625 C114 99 114 99 115.8125 100.5 C117.57140928 104.20296689 117.6000365 107.96339084 117 112 C115 114 115 114 112.82293701 114.24888897 C111.91295959 114.2483442 111.00298218 114.24779943 110.06542969 114.24723816 C109.02221558 114.25143265 107.97900146 114.25562714 106.9041748 114.25994873 C105.75501587 114.25432922 104.60585693 114.24870972 103.421875 114.24291992 C102.21535278 114.24481827 101.00883057 114.24671661 99.76574707 114.24867249 C96.45169486 114.25174855 93.13789069 114.24585668 89.8238678 114.23571944 C86.36011909 114.2269498 82.89637473 114.22869618 79.43261719 114.2290802 C73.61521146 114.22814304 67.79785783 114.2194522 61.98046875 114.20581055 C55.24921227 114.19008448 48.51801287 114.18481242 41.78673935 114.1855461 C35.31863358 114.18615596 28.85054646 114.18105439 22.38244629 114.17275429 C19.62650405 114.16921861 16.87056842 114.16739063 14.11462402 114.16686058 C10.26910373 114.16567173 6.42363115 114.15596846 2.578125 114.14526367 C0.8543866 114.14594345 0.8543866 114.14594345 -0.9041748 114.14663696 C-1.94738892 114.14237198 -2.99060303 114.13810699 -4.06542969 114.13371277 C-4.9754071 114.13203692 -5.88538452 114.13036108 -6.82293701 114.12863445 C-9 114 -9 114 -11 113 C-11.78150669 104.05609012 -11.78150669 104.05609012 -8.6875 99.875 C-6 98 -6 98 -3 98 C-3.00666183 96.83124329 -3.01332367 95.66248657 -3.02018738 94.45831299 C-3.08096307 83.45191202 -3.12595565 72.44554504 -3.15543652 61.43901443 C-3.17110236 55.78023544 -3.19235759 50.12159175 -3.22631836 44.46289062 C-3.25887876 39.00345273 -3.27684609 33.5441451 -3.28463173 28.08461761 C-3.29018119 26.00016987 -3.30101773 23.91572937 -3.31719017 21.83133698 C-3.33892014 18.91506967 -3.34196876 15.99934286 -3.34057617 13.08300781 C-3.35675491 11.78612534 -3.35675491 11.78612534 -3.3732605 10.46304321 C-3.34279011 4.578575 -3.34279011 4.578575 -1.47871399 1.43231201 C-0.99073837 0.95964905 -0.50276276 0.48698608 0 0 Z M8 21 C8 28.92 8 36.84 8 45 C22.85 45 37.7 45 53 45 C53.66 42.69 54.32 40.38 55 38 C57.64 38 60.28 38 63 38 C63.66 40.31 64.32 42.62 65 45 C67.97 45 70.94 45 74 45 C74.99 42.69 75.98 40.38 77 38 C79.97 38 82.94 38 86 38 C86.495 41.465 86.495 41.465 87 45 C90.63 45 94.26 45 98 45 C98 37.08 98 29.16 98 21 C82.49 21 66.98 21 51 21 C50.01 23.31 49.02 25.62 48 28 C45.03 28 42.06 28 39 28 C38.67 25.69 38.34 23.38 38 21 C35.03 21 32.06 21 29 21 C28.01 23.31 27.02 25.62 26 28 C22.625 28.125 22.625 28.125 19 28 C16.64046906 25.64046906 16.50858587 24.22104383 16 21 C13.36 21 10.72 21 8 21 Z M8 49 C8 56.92 8 64.84 8 73 C10.64 73 13.28 73 16 73 C16.33 70.69 16.66 68.38 17 66 C19.97 66 22.94 66 26 66 C26.99 68.31 27.98 70.62 29 73 C31.97 73 34.94 73 38 73 C38.33 70.69 38.66 68.38 39 66 C41.97 66 44.94 66 48 66 C48.99 68.31 49.98 70.62 51 73 C66.51 73 82.02 73 98 73 C98 65.08 98 57.16 98 49 C94.37 49 90.74 49 87 49 C86.67 51.31 86.34 53.62 86 56 C83.03 56 80.06 56 77 56 C76.01 53.69 75.02 51.38 74 49 C71.03 49 68.06 49 65 49 C64.34 51.31 63.68 53.62 63 56 C60.36 56 57.72 56 55 56 C54.34 53.69 53.68 51.38 53 49 C38.15 49 23.3 49 8 49 Z M8 77 C8 83.93 8 90.86 8 98 C37.7 98 67.4 98 98 98 C98 91.07 98 84.14 98 77 C82.49 77 66.98 77 51 77 C50.01 79.31 49.02 81.62 48 84 C45.36 84 42.72 84 40 84 C39.34 81.69 38.68 79.38 38 77 C35.03 77 32.06 77 29 77 C28.01 79.31 27.02 81.62 26 84 C23.03 84 20.06 84 17 84 C16.67 81.69 16.34 79.38 16 77 C13.36 77 10.72 77 8 77 Z " fill="#D98559" transform="translate(11,7)"/>
      <path d="M0 0 C1.14362 -0.0087616 2.28723999 -0.01752319 3.46551514 -0.02655029 C7.24562524 -0.04855603 11.02456551 -0.03398574 14.8046875 -0.01708984 C17.43115463 -0.0204576 20.05762024 -0.02530987 22.68408203 -0.03158569 C28.18860548 -0.04067488 33.69279319 -0.02871402 39.19726562 -0.00488281 C45.5555849 0.02232767 51.9131025 0.01351295 58.27140236 -0.01401484 C64.39521517 -0.03946331 70.51867337 -0.03673885 76.64251709 -0.02210617 C79.24526074 -0.01876884 81.84802483 -0.02287064 84.45074463 -0.03450394 C88.08750741 -0.04719142 91.72272726 -0.02786139 95.359375 0 C96.43693054 -0.01012115 97.51448608 -0.02024231 98.62469482 -0.03067017 C105.91808471 0.07293543 105.91808471 0.07293543 109.85229492 3.03823853 C111.7916112 5.80675177 112.29224382 7.00840257 112.1171875 10.33447266 C112.08431641 11.48496094 112.08431641 11.48496094 112.05078125 12.65869141 C111.6796875 14.64697266 111.6796875 14.64697266 109.6796875 16.64697266 C107.50262451 16.89586163 107.50262451 16.89586163 104.74511719 16.89421082 C103.70190308 16.8984053 102.65868896 16.90259979 101.5838623 16.90692139 C100.43470337 16.90130188 99.28554443 16.89568237 98.1015625 16.88989258 C96.89504028 16.89179092 95.68851807 16.89368927 94.44543457 16.89564514 C91.13138236 16.89872121 87.81757819 16.89282934 84.5035553 16.8826921 C81.03980659 16.87392246 77.57606223 16.87566883 74.11230469 16.87605286 C68.29489896 16.8751157 62.47754533 16.86642486 56.66015625 16.8527832 C49.92889977 16.83705713 43.19770037 16.83178507 36.46642685 16.83251876 C29.99832108 16.83312861 23.53023396 16.82802705 17.06213379 16.81972694 C14.30619155 16.81619127 11.55025592 16.81436329 8.79431152 16.81383324 C4.94879123 16.81264439 1.10331865 16.80294112 -2.7421875 16.79223633 C-4.4659259 16.79291611 -4.4659259 16.79291611 -6.2244873 16.79360962 C-7.26770142 16.78934464 -8.31091553 16.78507965 -9.38574219 16.78068542 C-10.2957196 16.77900958 -11.20569702 16.77733374 -12.14324951 16.77560711 C-14.3203125 16.64697266 -14.3203125 16.64697266 -16.3203125 15.64697266 C-16.4566253 14.08694837 -16.55290376 12.5234009 -16.6328125 10.95947266 C-16.71982422 9.65429688 -16.71982422 9.65429688 -16.80859375 8.32275391 C-15.17533276 -0.6275163 -7.28789438 -0.068453 0 0 Z " fill="#FABD65" transform="translate(16.3203125,104.35302734375)"/>
      <path d="M0 0 C6.875 0.875 6.875 0.875 8 2 C8.07313567 4.53049402 8.09247527 7.03304837 8.0625 9.5625 C8.05798828 10.27341797 8.05347656 10.98433594 8.04882812 11.71679688 C8.03700864 13.47790013 8.01907263 15.23896036 8 17 C10.64 17 13.28 17 16 17 C16 18.32 16 19.64 16 21 C13.36 21 10.72 21 8 21 C8 28.92 8 36.84 8 45 C22.85 45 37.7 45 53 45 C53 43.02 53 41.04 53 39 C55 37 55 37 56.875 36.734375 C57.57625 36.73953125 58.2775 36.7446875 59 36.75 C59.70125 36.74484375 60.4025 36.7396875 61.125 36.734375 C63 37 63 37 65 39 C65.125 42.125 65.125 42.125 65 45 C67.97 45 70.94 45 74 45 C74.12375 44.05125 74.2475 43.1025 74.375 42.125 C75 39 75 39 77 37 C83.12550258 36.44313613 83.12550258 36.44313613 85.69921875 38.08203125 C87.67898405 41.00114465 87.39676455 43.51767225 87.375 47 C87.38660156 48.85625 87.38660156 48.85625 87.3984375 50.75 C87 54 87 54 85.6953125 55.91015625 C82.7891041 57.77843308 80.33191418 57.41648927 77 57 C75.0625 55.25 75.0625 55.25 74 53 C74 51.68 74 50.36 74 49 C71.03 49 68.06 49 65 49 C65.04125 49.94875 65.0825 50.8975 65.125 51.875 C65 55 65 55 63 57 C61.125 57.265625 61.125 57.265625 59 57.25 C58.29875 57.25515625 57.5975 57.2603125 56.875 57.265625 C55 57 55 57 53 55 C53 53.02 53 51.04 53 49 C38.15 49 23.3 49 8 49 C8 56.92 8 64.84 8 73 C10.64 73 13.28 73 16 73 C16 74.32 16 75.64 16 77 C13.36 77 10.72 77 8 77 C8 83.93 8 90.86 8 98 C4.37 98 0.74 98 -3 98 C-3.06946484 85.81304166 -3.12279346 73.62613031 -3.15543652 61.43901443 C-3.17110236 55.78023544 -3.19235759 50.12159175 -3.22631836 44.46289062 C-3.25887876 39.00345273 -3.27684609 33.5441451 -3.28463173 28.08461761 C-3.29018119 26.00016987 -3.30101773 23.91572937 -3.31719017 21.83133698 C-3.33892014 18.91506967 -3.34196876 15.99934286 -3.34057617 13.08300781 C-3.35675491 11.78612534 -3.35675491 11.78612534 -3.3732605 10.46304321 C-3.34279011 4.578575 -3.34279011 4.578575 -1.47871399 1.43231201 C-0.99073837 0.95964905 -0.50276276 0.48698608 0 0 Z " fill="#DE9873" transform="translate(11,7)"/>
      <path d="M0 0 C1.9375 1.75 1.9375 1.75 3 4 C3 5.32 3 6.64 3 8 C5.97 8 8.94 8 12 8 C12.12375 6.865625 12.2475 5.73125 12.375 4.5625 C12.684375 2.7990625 12.684375 2.7990625 13 1 C16.11877956 -0.55938978 18.57255771 -0.3607834 22 0 C25.0482397 2.94990939 25.22338846 5.93681083 25.375 10 C25.09970958 17.09402227 25.09970958 17.09402227 22 20 C19.1044278 20.55069165 17.0058125 20.33397917 14 20 C12 18 12 18 11.875 14.875 C11.91625 13.92625 11.9575 12.9775 12 12 C9.03 12 6.06 12 3 12 C2.87625 12.94875 2.7525 13.8975 2.625 14.875 C2 18 2 18 0 20 C-6.12550258 20.55686387 -6.12550258 20.55686387 -8.69921875 18.91796875 C-10.67898405 15.99885535 -10.39676455 13.48232775 -10.375 10 C-10.38273437 8.7625 -10.39046875 7.525 -10.3984375 6.25 C-10 3 -10 3 -8.6953125 1.08984375 C-5.7891041 -0.77843308 -3.33191418 -0.41648927 0 0 Z " fill="#F7626E" transform="translate(37,72)"/>
      <path d="M0 0 C1.9375 1.75 1.9375 1.75 3 4 C3 5.32 3 6.64 3 8 C5.97 8 8.94 8 12 8 C11.95875 7.05125 11.9175 6.1025 11.875 5.125 C12 2 12 2 14 0 C17.0058125 -0.33397917 19.1044278 -0.55069165 22 0 C25.10629763 2.91215403 25.21699162 5.92824568 25.375 10 C25.22338846 14.06318917 25.0482397 17.05009061 22 20 C18.46723617 20.50468055 16.15998772 20.71096021 13.0625 18.8125 C11.67148017 16.43958382 11.78082683 14.70313576 12 12 C9.03 12 6.06 12 3 12 C2.87625 12.94875 2.7525 13.8975 2.625 14.875 C2 18 2 18 0 20 C-6.12550258 20.55686387 -6.12550258 20.55686387 -8.69921875 18.91796875 C-10.67898405 15.99885535 -10.39676455 13.48232775 -10.375 10 C-10.38273437 8.7625 -10.39046875 7.525 -10.3984375 6.25 C-10 3 -10 3 -8.6953125 1.08984375 C-5.7891041 -0.77843308 -3.33191418 -0.41648927 0 0 Z " fill="#A1E32C" transform="translate(37,16)"/>
      <path d="M0 0 C0.70125 0.00515625 1.4025 0.0103125 2.125 0.015625 C2.82625 0.01046875 3.5275 0.0053125 4.25 0 C6.125 0.265625 6.125 0.265625 8.125 2.265625 C8.25 5.390625 8.25 5.390625 8.125 8.265625 C11.095 8.265625 14.065 8.265625 17.125 8.265625 C17.24875 7.316875 17.3725 6.368125 17.5 5.390625 C18.125 2.265625 18.125 2.265625 20.125 0.265625 C26.25050258 -0.29123887 26.25050258 -0.29123887 28.82421875 1.34765625 C30.80398405 4.26676965 30.52176455 6.78329725 30.5 10.265625 C30.51160156 12.121875 30.51160156 12.121875 30.5234375 14.015625 C30.125 17.265625 30.125 17.265625 28.8203125 19.17578125 C25.9141041 21.04405808 23.45691418 20.68211427 20.125 20.265625 C18.1875 18.515625 18.1875 18.515625 17.125 16.265625 C17.125 14.945625 17.125 13.625625 17.125 12.265625 C14.155 12.265625 11.185 12.265625 8.125 12.265625 C8.186875 13.68875 8.186875 13.68875 8.25 15.140625 C8.125 18.265625 8.125 18.265625 6.125 20.265625 C4.25 20.53125 4.25 20.53125 2.125 20.515625 C1.073125 20.52335937 1.073125 20.52335937 0 20.53125 C-1.875 20.265625 -1.875 20.265625 -3.875 18.265625 C-4.07352102 15.55639699 -4.15339477 12.97259321 -4.125 10.265625 C-4.13273437 9.52828125 -4.14046875 8.7909375 -4.1484375 8.03125 C-4.12125719 0.58384477 -4.12125719 0.58384477 0 0 Z " fill="#89C5FB" transform="translate(67.875,43.734375)"/>
      <path d="M0 0 C2.39774745 -0.13572155 4.78775245 -0.23436868 7.1875 -0.3125 C8.19780273 -0.3753418 8.19780273 -0.3753418 9.22851562 -0.43945312 C13.10766747 -0.53406658 14.83108385 -0.12702138 17.9609375 2.2265625 C20.07806287 5.10617747 20.62124868 6.19627517 20.4375 9.6875 C20.41558594 10.45449219 20.39367187 11.22148438 20.37109375 12.01171875 C20 14 20 14 18 16 C15.41935871 16.14497985 12.95056116 16.18677545 10.375 16.125 C9.31539062 16.11146484 9.31539062 16.11146484 8.234375 16.09765625 C6.48943902 16.07407603 4.74467705 16.03820461 3 16 C2.92652344 14.64455078 2.92652344 14.64455078 2.8515625 13.26171875 C2.77679688 12.08222656 2.70203125 10.90273437 2.625 9.6875 C2.55539063 8.51574219 2.48578125 7.34398438 2.4140625 6.13671875 C2.21386253 2.84300113 2.21386253 2.84300113 0 0 Z " fill="#FAA516" transform="translate(108,105)"/>
      <path d="M0 0 C3.0482397 2.94990939 3.22338846 5.93681083 3.375 10 C3.09970958 17.09402227 3.09970958 17.09402227 0 20 C-2.8955722 20.55069165 -4.9941875 20.33397917 -8 20 C-10.47385671 17.52614329 -10.28571102 16.02495772 -10.32226562 12.63867188 C-10.31904297 11.95353516 -10.31582031 11.26839844 -10.3125 10.5625 C-10.32861328 9.88123047 -10.34472656 9.19996094 -10.36132812 8.49804688 C-10.36417644 5.58992124 -10.34425106 3.51379212 -8.69921875 1.05859375 C-5.74086743 -0.78442512 -3.36066812 -0.48009545 0 0 Z " fill="#F8626D" transform="translate(59,72)"/>
      <path d="M0 0 C3.06018958 0.10552378 3.7551172 0.14932863 6.0625 2.3125 C7.82713179 7.82697435 7.86621447 13.07363391 6 18.5625 C4.0625 20.4375 4.0625 20.4375 0.5625 20.9375 C-2.9375 20.4375 -2.9375 20.4375 -4.63671875 19.37890625 C-6.63641757 16.39437077 -6.33191943 13.3385536 -6.25 9.875 C-6.25322266 9.18986328 -6.25644531 8.50472656 -6.25976562 7.79882812 C-6.19966742 2.23154935 -5.86944858 0.65216095 0 0 Z " fill="#A1E42B" transform="translate(54.9375,15.5625)"/>
      <path d="M0 0 C0.70125 0.00515625 1.4025 0.0103125 2.125 0.015625 C2.82625 0.01046875 3.5275 0.0053125 4.25 0 C6.125 0.265625 6.125 0.265625 8.125 2.265625 C8.32352102 4.97485301 8.40339477 7.55865679 8.375 10.265625 C8.38273437 11.00296875 8.39046875 11.7403125 8.3984375 12.5 C8.3783196 18.0123054 8.3783196 18.0123054 6.125 20.265625 C4.25 20.53125 4.25 20.53125 2.125 20.515625 C1.073125 20.52335937 1.073125 20.52335937 0 20.53125 C-1.875 20.265625 -1.875 20.265625 -3.875 18.265625 C-4.07352102 15.55639699 -4.15339477 12.97259321 -4.125 10.265625 C-4.13273437 9.52828125 -4.14046875 8.7909375 -4.1484375 8.03125 C-4.12125719 0.58384477 -4.12125719 0.58384477 0 0 Z " fill="#89C6FC" transform="translate(67.875,43.734375)"/>
      <path d="M0 0 C16.17 0 32.34 0 49 0 C49 1.32 49 2.64 49 4 C32.83 4 16.66 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#818080" transform="translate(61,80)"/>
      <path d="M0 0 C16.17 0 32.34 0 49 0 C49 1.32 49 2.64 49 4 C32.83 4 16.66 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#818180" transform="translate(61,24)"/>
      <path d="M0 0 C14.85 0 29.7 0 45 0 C45 1.32 45 2.64 45 4 C30.15 4 15.3 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#818181" transform="translate(19,52)"/>
      <path d="M0 0 C3.96 0 7.92 0 12 0 C12 1.32 12 2.64 12 4 C8.04 4 4.08 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#83817F" transform="translate(98,52)"/>
      <path d="M0 0 C3.3 0 6.6 0 10 0 C10 1.32 10 2.64 10 4 C6.7 4 3.4 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#848080" transform="translate(39,80)"/>
      <path d="M0 0 C3.3 0 6.6 0 10 0 C10 1.32 10 2.64 10 4 C6.7 4 3.4 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#818283" transform="translate(76,52)"/>
      <path d="M0 0 C3.3 0 6.6 0 10 0 C10 1.32 10 2.64 10 4 C6.7 4 3.4 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#82847E" transform="translate(39,24)"/>
      <path d="M0 0 C2.64 0 5.28 0 8 0 C8 1.32 8 2.64 8 4 C5.36 4 2.72 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#818181" transform="translate(19,80)"/>
      <path d="M0 0 C2.64 0 5.28 0 8 0 C8 1.32 8 2.64 8 4 C5.36 4 2.72 4 0 4 C0 2.68 0 1.36 0 0 Z " fill="#818181" transform="translate(19,24)"/>
  `
  const svgIconNumber1Digit = `
      <!-- This rectangle will be rendered first -->
      <rect x="40" y="37" width="50" height="65" fill="black" opacity="0.5"/>
      <text x="64" y="97" font-size="75" text-anchor="middle" fill="white" font-weight="600" font-family="Segoe UI">${tabCount.toString()}</text>        
    </svg>
  `;

  const svgIconNumber2Digit = `
      <!-- This rectangle will be rendered first -->
      <rect x="25" y="37" width="80" height="65" fill="black" opacity="0.5"/>
      <text x="64" y="95" font-size="75" text-anchor="middle" fill="white" font-weight="600" font-family="Segoe UI">${tabCount.toString()}</text>        
    </svg>
  `;

  const svgIconNumber3Digit = `
      <!-- This rectangle will be rendered first -->
      <rect x="4" y="37" width="120" height="65" fill="black" opacity="0.5"/>
      <text x="64" y="95" font-size="75" text-anchor="middle" fill="white" font-weight="600" font-family="Segoe UI">${tabCount.toString()}</text>        
    </svg>
  `;

  const svgIconNumber4Digit = `
      <!-- This rectangle will be rendered first -->
      <rect x="0" y="35" width="128" height="60" fill="black" opacity="0.5"/>
      <text x="64" y="90" font-size="70" text-anchor="middle" fill="white" font-weight="600" font-family="Segoe UI" textLength="100%" lengthAdjust="spacingAndGlyphs">${tabCount.toString()}</text>
    </svg>
  `;

  let svgIcon;

  if (tabCount < 10) { // 1 digit
  svgIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgIconBase + svgIconNumber1Digit)}`;
  } else if (tabCount < 100) { // 2 digits
    svgIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgIconBase + svgIconNumber2Digit)}`;
  } else if (tabCount < 1000) { // 3 digits
    svgIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgIconBase + svgIconNumber3Digit)}`;
  } else { // 1000+ tabs
    svgIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgIconBase + svgIconNumber4Digit)}`;
  }
  browser.browserAction.setIcon({path: svgIcon});
}

async function updateBadgeDisplay(tabCount) {
  const displayOption = await getDisplayOption();
  switch (displayOption) {
      case 'nativeBadge':
          if (tabCount < 1000) {
            browser.browserAction.setIcon({path: "images/icon.png"});
            browser.browserAction.setBadgeText({ text: tabCount });
            break;
          }
          else {
            browser.browserAction.setIcon({path: "images/icon.png"});
            browser.browserAction.setBadgeText({ text: "999" });
            break;
          }
      case 'switchToSVG':
          // Logic to switch between badge and SVG @ 1000 tabs
          if (tabCount < 1000) {
            browser.browserAction.setIcon({path: "images/icon.png"});
            browser.browserAction.setBadgeText({ text: tabCount });
            break;
          }
          else {
            svgRenderBadge(tabCount);
            browser.browserAction.setBadgeText({ text: '' });
            break;
          }
      case 'alwaysSVG':
          // Logic for always using SVG
          svgRenderBadge(tabCount);
          browser.browserAction.setBadgeText({ text: '' });
          break;
      default:
          console.error('Unknown display option:', displayOption);
  }
}

const updateTabCount = async () => {
  try {
    // Get all tabs globally
    const allTabs = await browser.tabs.query({});
    const loadedTabsGlobal = allTabs.filter(tab => !tab.discarded).length;
    const totalTabsGlobal = allTabs.length;
    const tabCount = totalTabsGlobal.toString();

    updateBadgeDisplay(tabCount);

    // Get all windows
    const windows = await browser.windows.getAll();
    let contents = '';

    let windowIndex = 1;

    if (tabCountMethod === 1) {
      // Iterate through each window to get tabs info
      for (const window of windows) {
        const tabsThisWindow = await browser.tabs.query({ windowId: window.id });
        const loadedTabsThisWindow = tabsThisWindow.filter(tab => !tab.discarded).length;
        const totalTabsThisWindow = tabsThisWindow.length;

        // Generate HTML content for this window if more than one window is open
        if (windows.length > 1) {
          contents += `<div style="display: flex; justify-content: center;">
                          <div style="font-family: monospace; display: table;">
                              <div style="display: table-row;">
                                  <span style="display: table-cell; text-align: right; width: 40px;">Win${windowIndex}:</span>
                                  <span style="display: table-cell; text-align: right; padding-left: 3px; width: 30px;" id="loadedTabsThisWindow-${window.id}">${loadedTabsThisWindow}</span>
                                  <span style="display: table-cell; padding-left: 2px;">/</span>
                                  <span style="display: table-cell; text-align: left; padding-left: 2px; width: 30px;" id="totalTabsThisWindow-${window.id}">${totalTabsThisWindow}</span>
                                  <span style="display: table-cell; padding-left: 3px;">tabs</span>
                              </div>
                          </div>
                      </div>`;

          windowIndex++; // Increment the counter at the end of each iteration
        }
      }

      // Add global tabs info
      contents += `<div style="display: flex; justify-content: center;">
                      <div style="font-family: monospace; display: table;">
                          <div style="display: table-row;">
                              <span style="display: table-cell; text-align: right; width: 40px;">Total:</span>
                              <span style="display: table-cell; text-align: right; padding-left: 3px; width: 30px;">${loadedTabsGlobal}</span>
                              <span style="display: table-cell; padding-left: 2px;">/</span>
                              <span style="display: table-cell; text-align: left; padding-left: 2px; width: 30px;">${totalTabsGlobal}</span>
                              <span style="display: table-cell; padding-left: 3px;">tabs</span>
                          </div>
                      </div>
                  </div>`;
      
      // After all content pieces have been put together, add padding with extra padding to the right
      contents = `<div style="font-size: smallest; padding-top: 0.5rem; padding-left: 0.5rem; padding-bottom: 0.5rem; padding-right: 1.50rem;">${contents}</div>`;            
    }
    else if (tabCountMethod === 2) {
        // Initialize an HTML string to collect entries
        let windowContentsHtml = '<div style="text-align: left; font-family: \'Arial Narrow\', sans-serif; font-size: smallest; padding-top: 0.5rem; padding-left: 0.5rem; padding-bottom: 0.5rem; padding-right: 1.25rem;">';

        let totalActiveTabs = 0;
        let grandTotalTabs = 0;

        for (const window of windows) {
            const tabsThisWindow = await browser.tabs.query({ windowId: window.id });
            const loadedTabsThisWindow = tabsThisWindow.filter(tab => !tab.discarded).length;
            const totalTabsThisWindow = tabsThisWindow.length;

            // Update the total counts
            totalActiveTabs += loadedTabsThisWindow;
            grandTotalTabs += totalTabsThisWindow;

            // Append the string for this window into the HTML string
            windowContentsHtml += `<span style="white-space: nowrap;">W${windowIndex}: ${loadedTabsThisWindow}/${totalTabsThisWindow}</span>, `;
            windowIndex++; // Increment the counter at the end of each iteration
        }

        // Append the total active/total tabs across all windows
        windowContentsHtml += `<span style="white-space: nowrap;">T: ${totalActiveTabs}/${grandTotalTabs}</span>`;

        windowContentsHtml += '</div>'; // Close the adjusted div

        // Assign the HTML string to contents
        contents = windowContentsHtml;
    }

    // Update the TST new tab button with the generated content
    await browser.runtime.sendMessage('treestyletab@piro.sakura.ne.jp', {
      type: 'set-extra-contents',
      place: 'new-tab-button',
      contents: contents,
    });

  } catch (e) {
    console.error('Failed to update tab count', e);
  }
};

// Listen for TST events
browser.runtime.onMessageExternal.addListener((message, sender) => {
  if (sender.id !== 'treestyletab@piro.sakura.ne.jp') return;

  console.log('Message from TST:', message);

  switch (message.type) {
    case 'ready':
    case 'tabbar-updated':
    case 'sidebar-show':
      console.log(new Date().toISOString() + ': Calling registerToTST() from onMessageExternal');
      registerToTST();
      break;
  }
});

// Listen for tab events
browser.tabs.onCreated.addListener(updateTabCount);
browser.tabs.onRemoved.addListener(updateTabCount);
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if ('discarded' in changeInfo) {
    updateTabCount();
  }
});

// Listen for window events and update newtab button height as needed
browser.windows.onCreated.addListener(registerToTST);
browser.windows.onRemoved.addListener(registerToTST);

browser.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "updateBadge") {
            updateTabCount();
            sendResponse({result: "Badge updated"});
        }
        return true; // keep the messaging channel open for sendResponse
    }
);

// Set badge text background to grey
browser.browserAction.setBadgeBackgroundColor({ color: '#808080' });

//Set badge text font color to white
browser.browserAction.setBadgeTextColor({ color: '#ffffff' });

async function initializeAddon() {
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  for (let i = 0; i < 15; i++) {
    console.log(new Date().toISOString() + ': Call to registerToTST #', i);
    registerToTST();
    await sleep(1000);
  }
}

initializeAddon();