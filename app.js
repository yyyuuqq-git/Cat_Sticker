// ==========================================
// 스티치 칭찬나라 JavaScript 핵심 기능 제어
// ==========================================

// 1. Supabase 연동 정보 설정
// TODO: Supabase 연동 시 아래 두 값을 채워주세요. 비어있으면 자동으로 로컬 모드로 부드럽게 작동합니다.
const SUPABASE_URL = "https://uewhzfktonpasqjnlzhm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVld2h6Zmt0b25wYXNxam5semhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4ODkxNTEsImV4cCI6MjA5OTQ2NTE1MX0.-o54WOhjWM6eV-ZI6u3_fiFLh9JyqhVMdtTqVkNtp0I";

let supabaseClient = null;
let isLocalMode = !SUPABASE_URL || !SUPABASE_ANON_KEY;

if (!isLocalMode) {
    try {
        if (!window.supabase) {
            throw new Error("Supabase CDN 라이브러리가 로드되지 않았습니다.");
        }
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase 연동이 정상 활성화되었습니다.");
    } catch (e) {
        console.error("Supabase 초기화 실패. 로컬 모드로 전환합니다.", e);
        isLocalMode = true;
    }
} else {
    console.log("Supabase 설정이 비어있어 '로컬 모드(기기 브라우저 저장)'로 구동됩니다.");
}

// 고양이 칭찬스티커 전용 보드 판별 (타 앱 보드 및 테스트 보드 자동 100% 격리)
function isCatBoard(b) {
    if (!b) return false;
    const idStr = String(typeof b === 'string' ? b : (b.id || "")).toUpperCase();
    const titleStr = String(typeof b === 'object' && b.title ? b.title : "").toUpperCase();
    
    // 1. 테스트 보드 배제 (TEST_BOARD_1, TEST-BOARD-xxx 등)
    if (idStr.startsWith("TEST-BOARD") || idStr.startsWith("TEST_BOARD") || idStr === "TEST-BOARD" || idStr === "TEST_BOARD") return false;
    
    // 2. 채소 보드 배제 (CHAEDO_, VEGE_ 등)
    if (idStr.startsWith("CHAEDO") || idStr.includes("VEGE") || idStr.includes("VEGETABLE") || titleStr.includes("채소") || titleStr.includes("야채") || titleStr.includes("당근")) return false;
    
    // 3. 달/우주 보드 배제 (TEST-COSMIC-BOARD, BON_WOOK, MOON, COSMIC, LUNAR, STITCH 등)
    if (idStr === "TEST-COSMIC-BOARD" || idStr.startsWith("BON_WOOK") || idStr.startsWith("MOON") || idStr.includes("COSMIC") || idStr.includes("LUNAR") || idStr.startsWith("TEST-COSMIC") || titleStr.includes("달") || titleStr.includes("우주") || titleStr.includes("MOON") || titleStr.includes("COSMIC") || titleStr.includes("LUNAR") || titleStr.includes("별") || titleStr.includes("스티치")) return false;
    
    return true;
}

let initialBoardId = localStorage.getItem("current_board_id");
if (initialBoardId && !isCatBoard(initialBoardId)) {
    initialBoardId = "CAT-BOARD";
    localStorage.setItem("current_board_id", initialBoardId);
}
let currentBoardId = initialBoardId || "CAT-BOARD";
let currentBoard = null;
let currentStickers = [];
let isEditorMode = localStorage.getItem("is_editor") === "true";
let deleteTargetIndex = null;
let deleteTargetBoardId = null;
let memoTargetIndex = null;
let editTargetIndex = null;

// 기본 보드 정보가 설정되지 않은 경우 신규 생성을 유도합니다.

// 3. HTML DOM 요소
const loadingSpinner = document.getElementById("loading-spinner");
const appContent = document.querySelector(".app-content");
const roleIcon = document.getElementById("role-icon");
const roleText = document.getElementById("role-text");
const btnToggleRole = document.getElementById("btn-toggle-role");
const boardTitle = document.getElementById("board-title");
const boardCodeDisplay = document.getElementById("board-code-display");
const progressCount = document.getElementById("progress-count");
const progressBarFill = document.getElementById("progress-bar-fill");
const celebrationBanner = document.getElementById("celebration-banner");
const celebrationRewardDetail = document.getElementById("celebration-reward-detail");
const stickerGrid = document.getElementById("sticker-grid");

// 사이드바 관련 요소 추가
const btnMenu = document.getElementById("btn-menu");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const btnSidebarClose = document.getElementById("btn-sidebar-close");
const boardListContainer = document.getElementById("board-list");
const btnAddBoardSidebar = document.getElementById("btn-add-board-sidebar");
const inputCreateBoardTitle = document.getElementById("input-create-board-title");

// 모달 및 입력 폼 요소
const modalPin = document.getElementById("modal-pin");
const inputPin = document.getElementById("input-pin");
const pinError = document.getElementById("pin-error");
const btnPinCancel = document.getElementById("btn-pin-cancel");
const btnPinSubmit = document.getElementById("btn-pin-submit");

const modalSettings = document.getElementById("modal-settings");
const inputSwitchBoard = document.getElementById("input-switch-board");
const btnSwitchBoard = document.getElementById("btn-switch-board");
const appMainLogo = document.getElementById("app-main-logo");
const editAppTitle = document.getElementById("edit-app-title");
const editPin = document.getElementById("edit-pin");
const editReaderName = document.getElementById("edit-reader-name");
const editEditorName = document.getElementById("edit-editor-name");
const btnSettingsClose = document.getElementById("btn-settings-close");
const btnSettingsSave = document.getElementById("btn-settings-save");

// RGB 색상 팔레트 모달 요소
const btnColorPalette = document.getElementById("btn-color-palette");
const modalColorPalette = document.getElementById("modal-color-palette");
const btnColorApply = document.getElementById("btn-color-apply");
const btnColorReset = document.getElementById("btn-color-reset");
const btnColorClose = document.getElementById("btn-color-close");
const rangeR = document.getElementById("range-r");
const rangeG = document.getElementById("range-g");
const rangeB = document.getElementById("range-b");
const valR = document.getElementById("val-r");
const valG = document.getElementById("val-g");
const valB = document.getElementById("val-b");
const colorPreviewBox = document.getElementById("color-preview-box");
const colorPreviewText = document.getElementById("color-preview-text");
const inputCustomColor = document.getElementById("input-custom-color");

// 칭찬판 정보 수정 모달 요소 (길게 누르기 연동)
const modalBoardEdit = document.getElementById("modal-board-edit");
const editBoardTitle = document.getElementById("edit-board-title");
const editBoardTargetCount = document.getElementById("edit-board-target-count");
const editBoardReward = document.getElementById("edit-board-reward");
const btnBoardEditClose = document.getElementById("btn-board-edit-close");
const btnBoardEditSave = document.getElementById("btn-board-edit-save");

let editTargetBoard = null;

const modalDelete = document.getElementById("modal-delete");
const deleteConfirmText = document.getElementById("delete-confirm-text");
const btnDeleteCancel = document.getElementById("btn-delete-cancel");
const btnDeleteConfirm = document.getElementById("btn-delete-confirm");

const modalShare = document.getElementById("modal-share");
const btnCreateBoard = document.getElementById("btn-create-board");
const btnShareClose = document.getElementById("btn-share-close");

const welcomeScreen = document.getElementById("welcome-screen");
const welcomeConnectCard = document.getElementById("welcome-connect-card");
const welcomeCreateCard = document.getElementById("welcome-create-card");
const welcomeInputBoardId = document.getElementById("welcome-input-board-id");
const btnWelcomeConnect = document.getElementById("btn-welcome-connect");
const btnWelcomeShowCreate = document.getElementById("btn-welcome-show-create");
const btnWelcomeBack = document.getElementById("btn-welcome-back");

const setupBoardId = document.getElementById("setup-board-id");
const setupTitle = document.getElementById("setup-title");
const setupTargetCount = document.getElementById("setup-target-count");
const setupReward = document.getElementById("setup-reward");
const setupPin = document.getElementById("setup-pin");
const btnSetupSubmit = document.getElementById("btn-setup-submit");

const modalMemoInput = document.getElementById("modal-memo-input");
const inputStickerMemo = document.getElementById("input-sticker-memo");
const btnMemoCancel = document.getElementById("btn-memo-cancel");
const btnMemoSubmit = document.getElementById("btn-memo-submit");

const modalMemoView = document.getElementById("modal-memo-view");
const viewStickerMemoText = document.getElementById("view-sticker-memo-text");
const viewStickerCreatedAt = document.getElementById("view-sticker-created-at");
const viewStickerUpdatedAt = document.getElementById("view-sticker-updated-at");
const btnMemoViewClose = document.getElementById("btn-memo-view-close");

const memoEditArea = document.getElementById("memo-edit-area");
const inputEditStickerMemo = document.getElementById("input-edit-sticker-memo");
const btnMemoEditStart = document.getElementById("btn-memo-edit-start");
const btnMemoEditCancel = document.getElementById("btn-memo-edit-cancel");
const btnMemoEditSave = document.getElementById("btn-memo-edit-save");

// 공용 버튼 트리거
const btnShare = document.getElementById("btn-share");
const btnSettings = document.getElementById("btn-settings");

// ==========================================
// 4. 데이터베이스 / 로컬스토리지 통신 매핑 API
// ==========================================

// 보드 불러오기
async function apiGetBoard(boardId) {
    if (isLocalMode || !supabaseClient) {
        const localData = localStorage.getItem(`board_${boardId}`);
        if (localData) {
            return JSON.parse(localData);
        }
        return null;
    } else {
        try {
            const fetchPromise = supabaseClient
                .from("praise_boards")
                .select("*")
                .eq("id", boardId)
                .maybeSingle();

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Supabase timeout")), 3500)
            );

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
            if (error) throw error;
            if (data) {
                // 로컬 캐시 업데이트
                localStorage.setItem(`board_${boardId}`, JSON.stringify(data));
                return data;
            }
            return null;
        } catch (e) {
            console.error("보드 조회 중 서버 에러 발생, 캐시를 반환합니다.", e);
            const cached = localStorage.getItem(`board_${boardId}`);
            if (cached) return JSON.parse(cached);
        }
    }
}

// 모든 고양이 보드 가져오기
async function apiGetAllBoards() {
    if (isLocalMode || !supabaseClient) {
        return getRegisteredBoards();
    } else {
        try {
            const fetchPromise = supabaseClient
                .from("praise_boards")
                .select("*");

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Supabase timeout")), 3500)
            );

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
            if (error) throw error;
            const catBoards = (data || []).filter(b => isCatBoard(b));
            return catBoards;
        } catch (e) {
            console.error("전체 보드 목록 조회 중 서버 에러 발생, 캐시를 반환합니다.", e);
            return getRegisteredBoards();
        }
    }
}

// 보드 생성 또는 수정
async function apiCreateBoard(board) {
    if (isLocalMode || !supabaseClient) {
        localStorage.setItem(`board_${board.id}`, JSON.stringify(board));
        return true;
    } else {
        try {
            const dbBoard = {
                id: board.id,
                title: board.title,
                target_count: board.target_count || 30,
                reward_text: board.reward_text || "",
                editor_pin: board.editor_pin || "1234",
                reader_role_name: board.reader_role_name || "여자친구 모드 (조회 전용)",
                editor_role_name: board.editor_role_name || "남자친구 모드 (부착 가능)"
            };
            if (board.created_at) {
                dbBoard.created_at = board.created_at;
            }

            const { error } = await supabaseClient
                .from("praise_boards")
                .upsert(dbBoard);
            if (error) {
                console.warn("Supabase 칭찬판 저장 중 에러가 발생하여 로컬 브라우저 캐시에 우선 저장합니다.", error);
                localStorage.setItem(`board_${board.id}`, JSON.stringify(board));
                return true;
            }
            localStorage.setItem(`board_${board.id}`, JSON.stringify(board));
            return true;
        } catch (e) {
            console.error("보드 생성/수정 실패", e);
            // 캐시 보존 fallback
            localStorage.setItem(`board_${board.id}`, JSON.stringify(board));
            return true;
        }
    }
}

// 보드 및 스티커 데이터베이스/로컬 캐시 완전 삭제
async function apiDeleteBoard(boardId) {
    // 1. 로컬 캐시 삭제
    localStorage.removeItem(`board_${boardId}`);
    localStorage.removeItem(`stickers_${boardId}`);
    localStorage.removeItem(`is_editor_${boardId}`);

    if (isLocalMode || !supabaseClient) {
        return true;
    } else {
        try {
            // 2. Supabase DB 삭제 (ON DELETE CASCADE로 인해 스티커 데이터도 함께 삭제됨)
            const { error } = await supabaseClient
                .from("praise_boards")
                .delete()
                .eq("id", boardId);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("보드 삭제 실패", e);
            return false;
        }
    }
}

// 부착된 스티커 목록 가져오기
async function apiGetStickers(boardId) {
    if (isLocalMode || !supabaseClient) {
        const localData = localStorage.getItem(`stickers_${boardId}`);
        return localData ? JSON.parse(localData) : [];
    } else {
        try {
            const fetchPromise = supabaseClient
                .from("praise_stickers")
                .select("*")
                .eq("board_id", boardId);

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Supabase timeout")), 3500)
            );

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
            if (error) throw error;
            localStorage.setItem(`stickers_${boardId}`, JSON.stringify(data));
            return data;
        } catch (e) {
            console.error("스티커 리스트 조회 중 서버 에러 발생, 캐시를 반환합니다.", e);
            const cached = localStorage.getItem(`stickers_${boardId}`);
            return cached ? JSON.parse(cached) : [];
        }
    }
}

// 스티커 부착
async function apiAddSticker(boardId, index, memo) {
    const nowISO = new Date().toISOString();
    if (isLocalMode || !supabaseClient) {
        const current = await apiGetStickers(boardId);
        if (!current.some(s => s.sticker_index === index)) {
            current.push({ 
                board_id: boardId, 
                sticker_index: index, 
                memo: memo,
                created_at: nowISO,
                updated_at: nowISO
            });
            localStorage.setItem(`stickers_${boardId}`, JSON.stringify(current));
        }
        return true;
    } else {
        try {
            const { error } = await supabaseClient
                .from("praise_stickers")
                .insert({ 
                    board_id: boardId, 
                    sticker_index: index, 
                    memo: memo,
                    created_at: nowISO,
                    updated_at: nowISO
                });
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("스티커 부착 실패", e);
            return false;
        }
    }
}

// 스티커 메모 수정
async function apiUpdateStickerMemo(boardId, index, memo) {
    const nowISO = new Date().toISOString();
    if (isLocalMode || !supabaseClient) {
        const current = await apiGetStickers(boardId);
        const sticker = current.find(s => s.sticker_index === index);
        if (sticker) {
            sticker.memo = memo;
            sticker.updated_at = nowISO;
            localStorage.setItem(`stickers_${boardId}`, JSON.stringify(current));
        }
        return true;
    } else {
        try {
            const { error } = await supabaseClient
                .from("praise_stickers")
                .update({ 
                    memo: memo, 
                    updated_at: nowISO 
                })
                .eq("board_id", boardId)
                .eq("sticker_index", index);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("스티커 메모 수정 실패", e);
            return false;
        }
    }
}

// 스티커 떼기
async function apiRemoveSticker(boardId, index) {
    if (isLocalMode || !supabaseClient) {
        let current = await apiGetStickers(boardId);
        current = current.filter(s => s.sticker_index !== index);
        localStorage.setItem(`stickers_${boardId}`, JSON.stringify(current));
        return true;
    } else {
        try {
            const { error } = await supabaseClient
                .from("praise_stickers")
                .delete()
                .eq("board_id", boardId)
                .eq("sticker_index", index);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("스티커 제거 실패", e);
            return false;
        }
    }
}

// 테마 색상 메타데이터 DB/로컬 저장 (인덱스 999 전용 레코드 활용 - 스키마 호환 100% 보장)
async function apiSaveThemeColor(boardId, hex) {
    if (!hex || !boardId) return;
    hex = hex.toUpperCase();
    const memoStr = `[theme:${hex}]`;
    const nowISO = new Date().toISOString();

    localStorage.setItem(`board_theme_color_${boardId}`, hex);

    if (isLocalMode || !supabaseClient) {
        let current = await apiGetStickers(boardId);
        let themeSticker = current.find(s => s.sticker_index === 999);
        if (themeSticker) {
            themeSticker.memo = memoStr;
            themeSticker.updated_at = nowISO;
        } else {
            current.push({
                board_id: boardId,
                sticker_index: 999,
                memo: memoStr,
                created_at: nowISO,
                updated_at: nowISO
            });
        }
        localStorage.setItem(`stickers_${boardId}`, JSON.stringify(current));
        return true;
    } else {
        try {
            const { data } = await supabaseClient
                .from("praise_stickers")
                .select("id")
                .eq("board_id", boardId)
                .eq("sticker_index", 999)
                .maybeSingle();

            if (data) {
                await supabaseClient
                    .from("praise_stickers")
                    .update({ memo: memoStr, updated_at: nowISO })
                    .eq("id", data.id);
            } else {
                await supabaseClient
                    .from("praise_stickers")
                    .insert({
                        board_id: boardId,
                        sticker_index: 999,
                        memo: memoStr,
                        created_at: nowISO,
                        updated_at: nowISO
                    });
            }
            return true;
        } catch (e) {
            console.error("테마 색상 DB 싱크 실패", e);
            return false;
        }
    }
}

// ==========================================
// 5. 수산시장 싱싱 어류 스티커 10종 빌더
// ==========================================
const STICKER_ITEMS = [
    { id: 0, name: "은빛 고등어 🐟", desc: "시장 최고 인기! 반짝이는 은빛 고등어" },
    { id: 1, name: "싱싱 연어 🍣", desc: "입안 가득 살살 녹는 주황빛 싱싱 연어" },
    { id: 2, name: "방글 복어 🐡", desc: "동글동글 귀엽게 방글거리는 노랑 복어" },
    { id: 3, name: "황금 참돔 🐠", desc: "바다의 여왕! 행운을 주는 귀한 참돔" },
    { id: 4, name: "꼬마상어 🦈", desc: "바다를 누비는 씩씩한 귀염둥이 꼬마상어" },
    { id: 5, name: "은빛 갈치 🐟", desc: "달빛처럼 길고 환하게 빛나는 은빛 갈치" },
    { id: 6, name: "넙적 광어 🐟", desc: "수산시장 최고 인기 횟감! 눈이 땡글한 넙적 광어" },
    { id: 7, name: "분홍 꽃새우 🦐", desc: "달콤하고 싱싱한 바다의 보석 꽃새우" },
    { id: 8, name: "싱싱 오징어 🦑", desc: "쫀득쫀득 맑고 투명한 새벽 활오징어" },
    { id: 9, name: "바다 고래 🐋", desc: "물뿜으며 큰 꿈을 응원하는 든든한 대왕고래" }
];
const CAT_PAWS = STICKER_ITEMS;

let selectedStickerType = 0;

function parseStickerMemo(rawMemo) {
    if (!rawMemo) return { type: null, memo: "" };
    const match = String(rawMemo).match(/^\[type:(\d+)\]\s*(.*)/s);
    if (match) {
        return { type: parseInt(match[1], 10), memo: match[2] };
    }
    return { type: null, memo: rawMemo };
}

function getFishMarketGraphic(type) {
    const safeType = (typeof type === 'number' && type >= 0 && type < 10) ? type : (Math.abs(type || 0) % 10);
    switch (safeType) {
        case 0: // 0: 🐟 은빛 고등어 (Fresh Mackerel)
            return `
                <defs>
                    <linearGradient id="fish-grad-mackerel-back" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#0F4C81"/>
                        <stop offset="50%" stop-color="#1E3A8A"/>
                        <stop offset="100%" stop-color="#0284C7"/>
                    </linearGradient>
                    <linearGradient id="fish-grad-mackerel-belly" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#E2E8F0"/>
                        <stop offset="100%" stop-color="#FFFFFF"/>
                    </linearGradient>
                </defs>
                <circle cx="88" cy="24" r="3" fill="#38BDF8" opacity="0.75"/>
                <circle cx="82" cy="16" r="2" fill="#7DD3FC" opacity="0.6"/>
                <path d="M 22 50 L 8 36 C 11 46, 12 54, 8 64 Z" fill="#0284C7" stroke="#0F4C81" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M 44 32 C 50 22, 62 25, 68 33 Z" fill="#0284C7" stroke="#0F4C81" stroke-width="1.6"/>
                <path d="M 32 60 C 36 68, 44 67, 48 60 Z" fill="#0284C7" stroke="#0F4C81" stroke-width="1.4"/>
                <path d="M 20 50 C 22 36, 42 28, 70 34 C 84 38, 92 48, 90 52 C 86 58, 68 70, 42 68 C 28 66, 20 58, 20 50 Z" fill="url(#fish-grad-mackerel-back)" stroke="#0F4C81" stroke-width="2.2" stroke-linejoin="round"/>
                <path d="M 22 50 C 30 58, 48 67, 72 61 C 82 58, 88 53, 90 52 C 86 58, 68 70, 42 68 C 28 66, 22 56, 22 50 Z" fill="url(#fish-grad-mackerel-belly)"/>
                <path d="M 40 33 L 42 41 M 48 31 L 49 43 M 56 31 L 55 43 M 64 33 L 62 42 M 72 36 L 69 43" stroke="#0A2540" stroke-width="2.6" stroke-linecap="round"/>
                <path d="M 74 41 C 72 47, 73 54, 76 58" stroke="#0F4C81" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <path d="M 64 52 C 58 56, 52 56, 50 52 C 54 50, 60 50, 64 52 Z" fill="#38BDF8" stroke="#0F4C81" stroke-width="1.4"/>
                <circle cx="80" cy="46" r="4.2" fill="#0F172A"/>
                <circle cx="81.5" cy="44.5" r="1.6" fill="#FFFFFF"/>
                <path d="M 88 52 C 86 54, 84 53, 83 52" stroke="#0F4C81" stroke-width="1.6" stroke-linecap="round" fill="none"/>
            `;
        case 1: // 1: 🍣 싱싱 연어 (Fresh Salmon)
            return `
                <defs>
                    <linearGradient id="fish-grad-salmon" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#FF5A36"/>
                        <stop offset="60%" stop-color="#FF7A59"/>
                        <stop offset="100%" stop-color="#FFA07A"/>
                    </linearGradient>
                </defs>
                <circle cx="16" cy="22" r="3.2" fill="#38BDF8" opacity="0.8"/>
                <circle cx="24" cy="15" r="2.2" fill="#7DD3FC" opacity="0.7"/>
                <path d="M 24 64 C 14 74, 8 84, 10 90 C 18 86, 22 78, 25 74 C 28 80, 32 86, 38 88 C 36 80, 30 72, 26 66 Z" fill="#FF5A36" stroke="#C2410C" stroke-width="2"/>
                <path d="M 46 25 C 52 18, 62 20, 66 28 Z" fill="#EA580C" stroke="#C2410C" stroke-width="1.8"/>
                <path d="M 60 68 C 58 76, 52 78, 48 72 Z" fill="#FF7A59" stroke="#C2410C" stroke-width="1.6"/>
                <path d="M 24 66 C 22 52, 34 32, 54 26 C 72 20, 88 28, 92 40 C 94 52, 82 66, 62 68 C 42 70, 28 72, 24 66 Z" fill="url(#fish-grad-salmon)" stroke="#C2410C" stroke-width="2.4" stroke-linejoin="round"/>
                <path d="M 40 38 Q 48 48 42 62" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.9"/>
                <path d="M 50 32 Q 59 44 54 60" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.9"/>
                <path d="M 62 30 Q 71 42 66 58" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.9"/>
                <path d="M 74 32 Q 80 40 76 52" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.85"/>
                <path d="M 72 50 C 66 58, 58 56, 56 50 C 62 48, 68 47, 72 50 Z" fill="#FF9E80" stroke="#C2410C" stroke-width="1.6"/>
                <path d="M 80 38 C 76 44, 77 52, 81 56" stroke="#C2410C" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <circle cx="85" cy="40" r="4" fill="#1C1917"/>
                <circle cx="86.5" cy="38.5" r="1.6" fill="#FFFFFF"/>
                <path d="M 91 46 C 89 48, 87 47, 86 46" stroke="#9A3412" stroke-width="1.8" stroke-linecap="round" fill="none"/>
            `;
        case 2: // 2: 🐡 방글 노랑 복어 (Chubby Pufferfish)
            return `
                <defs>
                    <radialGradient id="fish-grad-puffer" cx="45%" cy="40%" r="60%">
                        <stop offset="0%" stop-color="#FEF08A"/>
                        <stop offset="55%" stop-color="#FACC15"/>
                        <stop offset="100%" stop-color="#EAB308"/>
                    </radialGradient>
                </defs>
                <circle cx="86" cy="30" r="4" fill="#38BDF8" opacity="0.8"/>
                <circle cx="91" cy="20" r="2.5" fill="#7DD3FC" opacity="0.7"/>
                <circle cx="82" cy="14" r="2" fill="#BAE6FD" opacity="0.6"/>
                <path d="M 18 50 C 8 42, 6 58, 18 54 Z" fill="#FBBF24" stroke="#CA8A04" stroke-width="2"/>
                <path d="M 40 18 C 45 12, 53 14, 52 20 Z" fill="#38BDF8" stroke="#0284C7" stroke-width="1.8"/>
                <path d="M 42 82 C 46 88, 54 86, 52 80 Z" fill="#FBBF24" stroke="#CA8A04" stroke-width="1.8"/>
                <ellipse cx="48" cy="50" rx="36" ry="34" fill="url(#fish-grad-puffer)" stroke="#CA8A04" stroke-width="2.6"/>
                <path d="M 22 40 C 26 24, 44 20, 68 24 C 54 28, 36 34, 22 40 Z" fill="#38BDF8" opacity="0.85"/>
                <circle cx="36" cy="26" r="2.2" fill="#0284C7"/>
                <circle cx="48" cy="27" r="2.5" fill="#0284C7"/>
                <circle cx="58" cy="30" r="2" fill="#0284C7"/>
                <path d="M 22 50 L 16 50 M 26 68 L 22 72 M 36 82 L 34 87 M 60 82 L 62 87 M 70 70 L 75 74 M 26 32 L 22 28 M 38 18 L 36 13 M 60 18 L 62 13" stroke="#CA8A04" stroke-width="2.4" stroke-linecap="round"/>
                <ellipse cx="64" cy="58" rx="6" ry="4" fill="#F43F5E" opacity="0.6"/>
                <path d="M 42 54 C 36 50, 34 62, 42 60 Z" fill="#FDE047" stroke="#CA8A04" stroke-width="1.8"/>
                <circle cx="66" cy="44" r="5.5" fill="#1E293B"/>
                <circle cx="68" cy="42" r="2" fill="#FFFFFF"/>
                <circle cx="64.5" cy="46" r="1" fill="#FFFFFF"/>
                <ellipse cx="82" cy="50" rx="3.5" ry="4" fill="#EF4444" stroke="#B91C1C" stroke-width="1.6"/>
            `;
        case 3: // 3: 🐠 황금 참돔 (Red Sea Bream / Lucky Bream)
            return `
                <defs>
                    <linearGradient id="fish-grad-bream" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#E11D48"/>
                        <stop offset="60%" stop-color="#F43F5E"/>
                        <stop offset="100%" stop-color="#FB7185"/>
                    </linearGradient>
                </defs>
                <path d="M 86 22 L 88 16 L 90 22 L 96 24 L 90 26 L 88 32 L 86 26 L 80 24 Z" fill="#FACC15"/>
                <circle cx="76" cy="18" r="2" fill="#FDE047"/>
                <path d="M 22 50 L 8 34 C 13 46, 13 54, 8 66 Z" fill="#BE123C" stroke="#9F1239" stroke-width="2" stroke-linejoin="round"/>
                <path d="M 32 30 L 36 18 L 44 26 L 50 16 L 58 24 L 66 18 L 70 28 Z" fill="#FACC15" stroke="#E11D48" stroke-width="2" stroke-linejoin="round"/>
                <path d="M 44 68 C 42 78, 52 78, 56 68 Z" fill="#FACC15" stroke="#B45309" stroke-width="1.8"/>
                <path d="M 20 50 C 22 34, 38 24, 66 26 C 82 28, 92 40, 90 52 C 88 64, 76 72, 54 72 C 34 72, 20 62, 20 50 Z" fill="url(#fish-grad-bream)" stroke="#9F1239" stroke-width="2.4" stroke-linejoin="round"/>
                <path d="M 40 40 Q 45 44 50 40 M 52 38 Q 57 42 62 38 M 36 50 Q 42 55 48 50 M 50 48 Q 56 53 62 48 M 42 60 Q 48 65 54 60" stroke="#FDE047" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.9"/>
                <path d="M 62 50 C 54 58, 46 54, 46 48 C 52 46, 58 46, 62 50 Z" fill="#FBBF24" stroke="#B45309" stroke-width="1.6"/>
                <path d="M 72 36 C 68 44, 70 54, 74 60" stroke="#9F1239" stroke-width="2" stroke-linecap="round" fill="none"/>
                <circle cx="78" cy="42" r="5" fill="#FACC15"/>
                <circle cx="79" cy="42" r="3.4" fill="#0F172A"/>
                <circle cx="80" cy="40.5" r="1.4" fill="#FFFFFF"/>
                <path d="M 88 50 C 86 52, 84 51, 83 50" stroke="#9F1239" stroke-width="1.8" stroke-linecap="round" fill="none"/>
            `;
        case 4: // 4: 🦈 귀요미 꼬마상어 (Friendly Baby Shark)
            return `
                <defs>
                    <linearGradient id="fish-grad-shark" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#0284C7"/>
                        <stop offset="65%" stop-color="#38BDF8"/>
                        <stop offset="100%" stop-color="#7DD3FC"/>
                    </linearGradient>
                </defs>
                <circle cx="20" cy="26" r="3" fill="#38BDF8" opacity="0.8"/>
                <circle cx="14" cy="34" r="2" fill="#7DD3FC" opacity="0.7"/>
                <path d="M 22 50 C 14 36, 6 34, 8 44 C 12 50, 16 52, 18 52 C 14 56, 8 62, 10 68 C 14 68, 18 60, 22 52 Z" fill="#0284C7" stroke="#0369A1" stroke-width="2"/>
                <path d="M 46 32 C 48 14, 58 16, 64 32 Z" fill="#0284C7" stroke="#0369A1" stroke-width="2"/>
                <path d="M 20 52 C 22 38, 40 30, 68 32 C 84 34, 94 46, 92 54 C 88 64, 68 70, 42 68 C 28 66, 20 60, 20 52 Z" fill="url(#fish-grad-shark)" stroke="#0369A1" stroke-width="2.4" stroke-linejoin="round"/>
                <path d="M 22 54 C 32 60, 48 66, 68 62 C 78 60, 86 56, 92 54 C 88 64, 68 70, 42 68 C 28 66, 22 58, 22 54 Z" fill="#FFFFFF"/>
                <path d="M 52 56 C 46 68, 56 72, 62 60 Z" fill="#0284C7" stroke="#0369A1" stroke-width="1.8"/>
                <line x1="68" y1="44" x2="68" y2="52" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round"/>
                <line x1="72" y1="45" x2="72" y2="51" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="80" cy="44" r="5" fill="#0F172A"/>
                <circle cx="81.5" cy="42.5" r="2" fill="#FFFFFF"/>
                <path d="M 80 54 Q 85 62 90 54 Z" fill="#FFFFFF" stroke="#0369A1" stroke-width="1.8" stroke-linejoin="round"/>
                <polygon points="83,54 85,57 87,54" fill="#FFFFFF" stroke="#0369A1" stroke-width="0.8"/>
            `;
        case 5: // 5: 🐟 반짝 은빛 갈치 (Silver Hairtail / Cutlassfish)
            return `
                <defs>
                    <linearGradient id="fish-grad-hairtail" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#E2E8F0"/>
                        <stop offset="40%" stop-color="#CBD5E1"/>
                        <stop offset="70%" stop-color="#94A3B8"/>
                        <stop offset="100%" stop-color="#38BDF8"/>
                    </linearGradient>
                </defs>
                <path d="M 82 18 L 84 12 L 86 18 L 92 20 L 86 22 L 84 28 L 82 22 L 76 20 Z" fill="#38BDF8"/>
                <path d="M 28 32 L 29 28 L 30 32 L 34 33 L 30 34 L 29 38 L 28 34 L 24 33 Z" fill="#7DD3FC"/>
                <path d="M 12 76 Q 28 48 48 42 Q 68 36 82 36 L 80 40 Q 66 40 48 46 Q 28 52 14 78 Z" fill="#BAE6FD" opacity="0.85"/>
                <path d="
                    M 10 84 
                    C 20 74, 30 54, 46 48 
                    C 62 42, 78 40, 92 46 
                    C 90 52, 76 50, 60 56 
                    C 44 62, 30 78, 12 86 Z" 
                    fill="url(#fish-grad-hairtail)" stroke="#475569" stroke-width="2.2" stroke-linejoin="round"/>
                <path d="M 36 56 Q 54 48 76 46" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.9"/>
                <path d="M 78 45 C 75 48, 76 52, 78 54" stroke="#475569" stroke-width="1.6" stroke-linecap="round" fill="none"/>
                <circle cx="84" cy="46" r="3.8" fill="#0F172A"/>
                <circle cx="85.2" cy="45" r="1.4" fill="#FFFFFF"/>
                <path d="M 92 48 L 88 50" stroke="#334155" stroke-width="1.8" stroke-linecap="round"/>
            `;
        case 6: // 6: 🐟 넙적 광어 (Cute Flat Flounder)
            return `
                <defs>
                    <linearGradient id="fish-grad-flounder" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#4F795B"/>
                        <stop offset="45%" stop-color="#6E9A78"/>
                        <stop offset="100%" stop-color="#9BC0A4"/>
                    </linearGradient>
                    <linearGradient id="fish-grad-flounder-fin" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#A8D5B5"/>
                        <stop offset="100%" stop-color="#6E9A78"/>
                    </linearGradient>
                    <radialGradient id="fish-spot-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#36573F" stop-opacity="0.6"/>
                        <stop offset="100%" stop-color="#36573F" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                <circle cx="88" cy="22" r="3.5" fill="#38BDF8" opacity="0.8"/>
                <circle cx="82" cy="14" r="2.2" fill="#7DD3FC" opacity="0.7"/>
                <circle cx="20" cy="78" r="2.8" fill="#BAE6FD" opacity="0.65"/>
                <path d="M 18 50 C 6 36, 4 64, 18 50 Z" fill="#6E9A78" stroke="#36573F" stroke-width="2"/>
                <path d="M 18 50 C 4 34, 4 66, 18 50 Z" fill="url(#fish-grad-flounder-fin)" stroke="#36573F" stroke-width="1.8"/>
                <path d="M 16 44 L 6 38 M 16 50 L 5 50 M 16 56 L 6 62" stroke="#36573F" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M 28 32 C 34 20, 44 18, 54 22 C 64 20, 74 24, 82 36" fill="url(#fish-grad-flounder-fin)" stroke="#36573F" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M 36 28 L 38 23 M 46 25 L 48 20 M 56 25 L 58 21 M 66 27 L 68 22 M 76 32 L 78 27" stroke="#36573F" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M 28 68 C 34 80, 44 82, 54 78 C 64 80, 74 76, 82 64" fill="url(#fish-grad-flounder-fin)" stroke="#36573F" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M 36 72 L 38 77 M 46 75 L 48 80 M 56 75 L 58 79 M 66 73 L 68 78 M 76 68 L 78 73" stroke="#36573F" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M 18 50 C 20 32, 42 24, 68 28 C 86 32, 94 44, 92 52 C 90 60, 84 68, 68 72 C 42 76, 20 68, 18 50 Z" fill="url(#fish-grad-flounder)" stroke="#36573F" stroke-width="2.4" stroke-linejoin="round"/>
                <circle cx="36" cy="46" r="4" fill="url(#fish-spot-glow)"/>
                <circle cx="48" cy="38" r="5" fill="url(#fish-spot-glow)"/>
                <circle cx="46" cy="58" r="4.5" fill="url(#fish-spot-glow)"/>
                <circle cx="60" cy="50" r="5.5" fill="url(#fish-spot-glow)"/>
                <circle cx="70" cy="62" r="3.5" fill="url(#fish-spot-glow)"/>
                <circle cx="30" cy="54" r="2.5" fill="#36573F" opacity="0.4"/>
                <circle cx="56" cy="36" r="2.8" fill="#36573F" opacity="0.4"/>
                <path d="M 52 54 C 50 63, 58 66, 62 58 C 62 52, 56 50, 52 54 Z" fill="#A8D5B5" stroke="#36573F" stroke-width="1.6"/>
                <path d="M 54 55 L 59 61" stroke="#36573F" stroke-width="1.2" stroke-linecap="round"/>
                <ellipse cx="80" cy="57" rx="4.5" ry="3" fill="#F472B6" opacity="0.75"/>
                <circle cx="74" cy="38" r="6" fill="#FFFFFF" stroke="#36573F" stroke-width="1.6"/>
                <circle cx="75" cy="38" r="3.8" fill="#14261A"/>
                <circle cx="76.2" cy="36.5" r="1.5" fill="#FFFFFF"/>
                <circle cx="83" cy="43" r="6" fill="#FFFFFF" stroke="#36573F" stroke-width="1.6"/>
                <circle cx="84" cy="43" r="3.8" fill="#14261A"/>
                <circle cx="85.2" cy="41.5" r="1.5" fill="#FFFFFF"/>
                <path d="M 91 50 C 89 53, 86 52, 85 50" stroke="#253D2C" stroke-width="1.8" stroke-linecap="round" fill="none"/>
            `;
        case 7: // 7: 🦐 탱글 분홍 꽃새우 (Sweet Prawn)
            return `
                <defs>
                    <linearGradient id="fish-grad-shrimp" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#FB7185"/>
                        <stop offset="50%" stop-color="#F97316"/>
                        <stop offset="100%" stop-color="#EA580C"/>
                    </linearGradient>
                </defs>
                <path d="M 76 34 C 88 20, 94 14, 96 8" stroke="#F97316" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <path d="M 76 36 C 88 30, 96 26, 98 22" stroke="#FB7185" stroke-width="1.6" stroke-linecap="round" fill="none"/>
                <path d="M 22 72 L 10 82 C 14 76, 16 70, 12 64 Z" fill="#EF4444" stroke="#C2410C" stroke-width="1.8"/>
                <path d="M 22 72 L 16 86 C 18 80, 22 76, 20 72 Z" fill="#F97316" stroke="#C2410C" stroke-width="1.6"/>
                <path d="
                    M 22 72 
                    C 18 56, 26 36, 44 26 
                    C 62 16, 76 24, 82 36 
                    C 84 46, 74 54, 62 52 
                    C 48 50, 36 58, 30 70 Z" 
                    fill="url(#fish-grad-shrimp)" stroke="#C2410C" stroke-width="2.4" stroke-linejoin="round"/>
                <path d="M 38 30 Q 48 40 40 50" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.9"/>
                <path d="M 49 25 Q 58 36 53 49" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.9"/>
                <path d="M 62 25 Q 70 34 66 46" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.9"/>
                <path d="M 44 52 L 40 60 M 52 51 L 49 59 M 60 50 L 58 57" stroke="#EA580C" stroke-width="2" stroke-linecap="round"/>
                <circle cx="76" cy="30" r="4.2" fill="#18181B"/>
                <circle cx="77.5" cy="28.5" r="1.6" fill="#FFFFFF"/>
            `;
        case 8: // 8: 🦑 싱싱 오징어 (Fresh Market Squid)
            return `
                <defs>
                    <linearGradient id="fish-grad-squid" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#FFFFFF"/>
                        <stop offset="60%" stop-color="#FFE4E6"/>
                        <stop offset="100%" stop-color="#FDA4AF"/>
                    </linearGradient>
                </defs>
                <polygon points="50,10 24,34 76,34" fill="#FDA4AF" stroke="#E11D48" stroke-width="2.2" stroke-linejoin="round"/>
                <path d="M 50 12 C 40 26, 32 40, 34 56 C 36 62, 64 62, 66 56 C 68 40, 60 26, 50 12 Z" fill="url(#fish-grad-squid)" stroke="#E11D48" stroke-width="2.4" stroke-linejoin="round"/>
                <circle cx="44" cy="38" r="2" fill="#FB7185" opacity="0.7"/>
                <circle cx="54" cy="44" r="2.2" fill="#FB7185" opacity="0.7"/>
                <circle cx="46" cy="50" r="1.8" fill="#FB7185" opacity="0.7"/>
                <circle cx="42" cy="58" r="4" fill="#1E293B"/>
                <circle cx="43.2" cy="56.8" r="1.5" fill="#FFFFFF"/>
                <circle cx="58" cy="58" r="4" fill="#1E293B"/>
                <circle cx="59.2" cy="56.8" r="1.5" fill="#FFFFFF"/>
                <path d="M 38 64 C 36 74, 30 84, 34 88" stroke="#E11D48" stroke-width="2.2" stroke-linecap="round" fill="none"/>
                <path d="M 44 64 C 44 76, 42 86, 46 90" stroke="#E11D48" stroke-width="2.2" stroke-linecap="round" fill="none"/>
                <path d="M 56 64 C 56 76, 58 86, 54 90" stroke="#E11D48" stroke-width="2.2" stroke-linecap="round" fill="none"/>
                <path d="M 62 64 C 64 74, 70 84, 66 88" stroke="#E11D48" stroke-width="2.2" stroke-linecap="round" fill="none"/>
                <circle cx="46" cy="91" r="2.5" fill="#FB7185"/>
                <circle cx="54" cy="91" r="2.5" fill="#FB7185"/>
            `;
        case 9: // 9: 🐋 푸른 바다 고래 (Blue Ocean Whale)
            return `
                <defs>
                    <linearGradient id="fish-grad-whale" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#1D4ED8"/>
                        <stop offset="60%" stop-color="#3B82F6"/>
                        <stop offset="100%" stop-color="#60A5FA"/>
                    </linearGradient>
                </defs>
                <path d="M 42 32 C 40 18, 28 14, 24 18 C 22 22, 28 26, 34 26" stroke="#38BDF8" stroke-width="2.2" stroke-linecap="round" fill="none"/>
                <path d="M 46 30 C 47 14, 58 14, 62 18 C 64 22, 58 26, 52 26" stroke="#38BDF8" stroke-width="2.2" stroke-linecap="round" fill="none"/>
                <path d="M 44 28 L 44 10" stroke="#38BDF8" stroke-width="2.4" stroke-linecap="round"/>
                <circle cx="24" cy="14" r="2.5" fill="#7DD3FC"/>
                <circle cx="62" cy="14" r="2.5" fill="#7DD3FC"/>
                <circle cx="44" cy="7" r="2" fill="#BAE6FD"/>
                <path d="M 74 58 C 82 46, 92 46, 94 50 C 92 56, 86 58, 82 58 C 86 60, 92 64, 92 70 C 88 74, 80 70, 74 60 Z" fill="#2563EB" stroke="#1D4ED8" stroke-width="2"/>
                <path d="
                    M 14 58 
                    C 12 44, 26 34, 46 34 
                    C 64 34, 76 44, 78 56 
                    C 78 68, 64 76, 46 76 
                    C 26 76, 14 70, 14 58 Z" 
                    fill="url(#fish-grad-whale)" stroke="#1E40AF" stroke-width="2.4" stroke-linejoin="round"/>
                <path d="
                    M 18 64 
                    C 28 72, 46 74, 62 68 
                    C 56 74, 42 76, 28 74 
                    C 22 72, 18 68, 18 64 Z" 
                    fill="#F8FAFC" stroke="#93C5FD" stroke-width="1.8"/>
                <path d="M 36 60 C 36 68, 46 72, 50 68 C 51 64, 46 58, 38 58 Z" fill="#3B82F6" stroke="#1D4ED8" stroke-width="1.8"/>
                <circle cx="28" cy="52" r="3.8" fill="#0F172A"/>
                <circle cx="29.2" cy="50.8" r="1.4" fill="#FFFFFF"/>
                <path d="M 22 58 Q 28 64 34 60" stroke="#1E40AF" stroke-width="2" stroke-linecap="round" fill="none"/>
            `;
        default:
            return "";
    }
}

// 하위 호환성을 위한 별칭 설정
const getPencilDoodleGraphic = getFishMarketGraphic;
const get3DStickerGraphic = getFishMarketGraphic;
const getCrystalSeaGraphic = getFishMarketGraphic;
const getCatPawGraphic = getFishMarketGraphic;

function getCatStickerSvg(index, isSticker, rawMemo = "") {
    const parsed = parseStickerMemo(rawMemo);
    const type = (parsed.type !== null && parsed.type >= 0 && parsed.type < 10) ? parsed.type : (index % 10);

    if (!isSticker) {
        return "";
    }
    return `
        <svg viewBox="0 0 100 100" class="fish-sticker-svg sea-sticker-svg active">
            ${getFishMarketGraphic(type)}
        </svg>
    `;
}

function renderStickerPickerGrid() {
    const gridContainer = document.getElementById("sticker-select-grid");
    if (!gridContainer) return;
    gridContainer.innerHTML = "";

    STICKER_ITEMS.forEach(item => {
        const isSel = item.id === selectedStickerType;
        const opt = document.createElement("div");
        opt.className = `sticker-option-item ${isSel ? "selected" : ""}`;
        opt.dataset.creatureId = item.id;
        opt.innerHTML = `
            <div class="sticker-option-icon">
                <svg viewBox="0 0 100 100" class="fish-sticker-svg" style="width:100%; height:100%;">
                    ${getFishMarketGraphic(item.id)}
                </svg>
            </div>
            <span class="sticker-option-label">${item.name}</span>
        `;

        const selectHandler = (e) => {
            if (e) e.stopPropagation();
            selectedStickerType = item.id;
            gridContainer.querySelectorAll(".sticker-option-item").forEach(el => el.classList.remove("selected"));
            opt.classList.add("selected");
        };

        opt.addEventListener("click", selectHandler);
        opt.addEventListener("touchstart", selectHandler, { passive: true });

        gridContainer.appendChild(opt);
    });
}


// 5.5 등록된 보드 목록 관리 및 사이드바 렌더링
// ==========================================

// 모든 스티커판 목록 조회 (서버 및 로컬 - 고양이 칭찬스티커 보드만 반환)
async function apiGetAllBoards() {
    if (isLocalMode || !supabaseClient) {
        // 로컬스토리지 전체 키 순회
        const boards = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith("board_")) {
                try {
                    const board = JSON.parse(localStorage.getItem(key));
                    if (board && isCatBoard(board)) {
                        boards.push(board);
                    }
                } catch(e){}
            }
        }
        boards.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        return boards;
    } else {
        try {
            const fetchPromise = supabaseClient
                .from("praise_boards")
                .select("*")
                .order("created_at", { ascending: true });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Supabase timeout")), 3500)
            );

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
            if (error) throw error;
            return (data || []).filter(b => isCatBoard(b));
        } catch (e) {
            console.error("전체 보드 조회 실패", e);
            const boards = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith("board_")) {
                    try {
                        const board = JSON.parse(localStorage.getItem(key));
                        if (board && isCatBoard(board)) {
                            boards.push(board);
                        }
                    } catch(e){}
                }
            }
            boards.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
            return boards;
        }
    }
}

// 다음 순차적 보드 코드 생성 (기존 보드 CAT-BOARD -> 두번째 보드는 CAT-BOARD_1, 세번째는 CAT-BOARD_2)
async function getNextSequentialBoardCode(baseBoardId) {
    const allBoards = await apiGetAllBoards();
    let sourceId = baseBoardId || currentBoardId || "CAT-BOARD";
    if (sourceId === "DEFAULT" || sourceId === "1") {
        sourceId = "CAT-BOARD";
    }
    
    let basePrefix = String(sourceId).trim().toUpperCase();
    basePrefix = basePrefix.replace(/_\d+$/, "").replace(/\d+$/, "");
    if (basePrefix.endsWith("_")) {
        basePrefix = basePrefix.slice(0, -1);
    }
    if (!basePrefix || basePrefix === "1") basePrefix = "CAT-BOARD";

    let maxNum = 0;

    allBoards.forEach(b => {
        if (b && b.id) {
            const idStr = String(b.id).trim().toUpperCase();
            if (idStr.startsWith(basePrefix)) {
                const match = idStr.match(new RegExp(`^${basePrefix.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}_?(\\d+)$`, "i"));
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num > maxNum) {
                        maxNum = num;
                    }
                }
            }
        }
    });

    const nextNum = maxNum + 1;
    return `${basePrefix}_${nextNum}`;
}

// 보드 이름 수정 API
async function apiUpdateBoardTitle(boardId, newTitle) {
    let board = await apiGetBoard(boardId);
    if (!board) return false;
    
    board.title = newTitle;
    const success = await apiCreateBoard(board);
    if (success) {
        addRegisteredBoard(boardId, newTitle);
        return true;
    }
    return false;
}

// 보드 아이템 정보 수정 모달 오픈 핸들러
async function openBoardEditModal(board) {
    // 최신 풀 보드 정보 조회 (목표 개수 및 보상 텍스트 유실 방지)
    let fullBoard = (await apiGetBoard(board.id)) || board;
    editTargetBoard = fullBoard;
    const hasPermission = localStorage.getItem("is_editor") === "true";

    if (hasPermission) {
        // 모든 입력 필드 활성화
        if (editBoardTitle) editBoardTitle.disabled = false;
        if (editBoardTargetCount) editBoardTargetCount.disabled = false;
        if (editBoardReward) editBoardReward.disabled = false;
        if (btnBoardEditSave) btnBoardEditSave.classList.remove("hidden");
    } else {
        // 읽기 전용으로 비활성화
        if (editBoardTitle) editBoardTitle.disabled = true;
        if (editBoardTargetCount) editBoardTargetCount.disabled = true;
        if (editBoardReward) editBoardReward.disabled = true;
        if (btnBoardEditSave) btnBoardEditSave.classList.add("hidden");
    }

    // 폼 값 세팅
    if (editBoardTitle) editBoardTitle.value = fullBoard.title || "";
    if (editBoardTargetCount) editBoardTargetCount.value = fullBoard.target_count || 30;
    if (editBoardReward) editBoardReward.value = fullBoard.reward_text || "";

    // 팝업 모달창 오픈
    if (modalBoardEdit) {
        modalBoardEdit.classList.remove("hidden");
    }
}

// 등록된 보드 목록 관리 헬퍼 함수들 (타 앱 보드 오염 자동 정화)
function getRegisteredBoards() {
    const list = localStorage.getItem("registered_boards");
    const parsed = list ? JSON.parse(list) : [];
    const filtered = parsed.filter(b => isCatBoard(b));
    if (parsed.length !== filtered.length) {
        localStorage.setItem("registered_boards", JSON.stringify(filtered));
    }
    return filtered;
}

function addRegisteredBoard(boardId, title, rewardText) {
    let list = getRegisteredBoards();
    const existingIndex = list.findIndex(b => b.id === boardId);
    if (existingIndex !== -1) {
        list[existingIndex].title = title;
        if (rewardText !== undefined) {
            list[existingIndex].reward_text = rewardText;
        }
    } else {
        list.push({ id: boardId, title: title, reward_text: rewardText || "" });
    }
    localStorage.setItem("registered_boards", JSON.stringify(list));
}

function getBoardOrder() {
    const saved = localStorage.getItem("board_order");
    return saved ? JSON.parse(saved) : [];
}

function saveBoardOrder(orderedIds) {
    localStorage.setItem("board_order", JSON.stringify(orderedIds));
    
    // registered_boards 내 순서도 동일하게 업데이트
    let list = getRegisteredBoards();
    list.sort((a, b) => {
        const idxA = orderedIds.indexOf(a.id);
        const idxB = orderedIds.indexOf(b.id);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });
    localStorage.setItem("registered_boards", JSON.stringify(list));
}

function removeRegisteredBoard(boardId) {
    let list = getRegisteredBoards();
    list = list.filter(b => b.id !== boardId);
    localStorage.setItem("registered_boards", JSON.stringify(list));
    
    // board_order에서도 제거
    const orderList = getBoardOrder().filter(id => id !== boardId);
    localStorage.setItem("board_order", JSON.stringify(orderList));
    
    if (currentBoardId === boardId) {
        if (list.length > 0) {
            currentBoardId = list[0].id;
        } else {
            currentBoardId = "DEFAULT";
        }
        localStorage.setItem("current_board_id", currentBoardId);
    }
}

let lastBoardListFingerprint = "";

// 사이드바 내부 보드 목록 동적 렌더링 (지능적 핑거프린트 대조로 깜빡임 완전 방지)
async function renderBoardList(force = false) {
    if (!boardListContainer) return;
    try {
        // 1. 서버 및 로컬 전체 보드 목록 가져오기
        let serverBoards = (await apiGetAllBoards()) || [];
        let localList = getRegisteredBoards() || [];
        
        // 통합 맵으로 중복 제거 및 병합 (서버에 새로 생성된 보드도 자동 표시되도록 함)
        const boardMap = new Map();
        serverBoards.forEach(b => {
            if (b && b.id) {
                boardMap.set(b.id, { ...b });
            }
        });
        localList.forEach(b => {
            if (b && b.id) {
                const existing = boardMap.get(b.id) || {};
                boardMap.set(b.id, { ...existing, ...b });
            }
        });
        
        const combinedList = Array.from(boardMap.values());

        // 1.5 저장된 사용자 지정 보드 순서 적용
        const orderList = getBoardOrder() || [];
        if (orderList.length > 0) {
            combinedList.sort((a, b) => {
                const idxA = orderList.indexOf(a.id);
                const idxB = orderList.indexOf(b.id);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return 0;
            });
        }

        const fingerprint = combinedList.map(b => `${b.id}:${b.title}:${b.reward_text}:${b.id === currentBoardId}`).join('|');
        
        // 변경 사항이 없으면 DOM 재작성 금지 (깜빡임 완전 차단!)
        if (!force && fingerprint === lastBoardListFingerprint) {
            return;
        }
        lastBoardListFingerprint = fingerprint;

        boardListContainer.innerHTML = "";
        
        // 2. 단일 리스트로 깔끔하게 렌더링
        if (combinedList.length === 0) {
            const emptyMsg = document.createElement("div");
            emptyMsg.style.fontSize = "11px";
            emptyMsg.style.color = "var(--text-muted)";
            emptyMsg.style.textAlign = "center";
            emptyMsg.style.padding = "10px 0";
            emptyMsg.textContent = "등록된 스티커판이 없습니다. 🧸";
            boardListContainer.appendChild(emptyMsg);
        } else {
            combinedList.forEach(board => {
                const item = createBoardItemDOM(board, true);
                boardListContainer.appendChild(item);
            });
        }
    } catch (e) {
        console.error("renderBoardList 렌더링 중 오류:", e);
    }
}

// 보드 아이템 DOM 요소 생성 헬퍼
function createBoardItemDOM(board, isLocal) {
    const isActive = board.id === currentBoardId;
    const item = document.createElement("div");
    item.className = `board-item ${isActive ? "active" : ""}`;
    item.dataset.boardId = board.id;
    
    const hasPermission = localStorage.getItem("is_editor") === "true";

    // 수정(연필) 아이콘 버튼 HTML (언제나 노출되어 상세 정보 수정 지원)
    const editButtonHtml = `
        <button class="btn-edit-board" title="스티커판 정보 수정">
            <span class="material-icons" style="font-size: 16px;">edit</span>
        </button>
    `;

    // 삭제(휴지통) 아이콘 버튼 HTML (로컬 및 편집 권한 보유 시에만 노출)
    const deleteButtonHtml = (isLocal && hasPermission) ? `
        <button class="btn-delete-board" title="삭제">
            <span class="material-icons" style="font-size: 16px;">delete</span>
        </button>
    ` : '';

    item.innerHTML = `
        <div class="board-item-info">
            <span class="board-item-title">${board.title}</span>
            <span class="board-item-code">보상: ${board.reward_text || '없음'}</span>
        </div>
        <div class="board-item-actions">
            ${editButtonHtml}
            ${deleteButtonHtml}
        </div>
    `;

    // 1. 클릭 시 스티커판 전환 이벤트 (드래그 중에는 클릭 전환 방지)
    let isReorderDrag = false;
    item.addEventListener("click", async () => {
        if (isReorderDrag) {
            isReorderDrag = false;
            return;
        }
        if (isActive) return;
        
        loadingSpinner.classList.remove("hidden");
        sidebar.classList.remove("open");
        sidebarOverlay.classList.add("hidden");
        
        currentBoardId = board.id;
        localStorage.setItem("current_board_id", currentBoardId);
        isEditorMode = localStorage.getItem("is_editor") === "true";
        updateRoleUI();
        await refreshApp();
        
        const newUrl = `${window.location.origin}${window.location.pathname}?board=${board.id}`;
        window.history.replaceState({ path: newUrl }, "", newUrl);
    });

    // 2. 롱프레스 터치/마우스 실시간 1:1 드래그 앤 드롭 재정렬 핸들러 (편집자 전용)
    let pressTimer = null;
    let startY = 0;
    let dragStartY = 0;
    let initialLayoutTop = 0;
    let isDragging = false;

    const startDragHandler = (e) => {
        if (e.type === 'mousedown' && e.button !== 0) return;
        const targetBtn = e.target.closest("button");
        if (targetBtn) return;

        isReorderDrag = false;
        startY = e.type.startsWith('touch') ? (e.touches[0] ? e.touches[0].clientY : 0) : e.clientY;

        pressTimer = setTimeout(() => {
            const canEdit = localStorage.getItem("is_editor") === "true";
            if (!canEdit) {
                showToast("편집자 권한(남자친구 모드)에서만 스티커판 순서를 변경할 수 있습니다. 🔒");
                return;
            }

            isDragging = true;
            isReorderDrag = true;
            dragStartY = startY;
            initialLayoutTop = item.offsetTop;

            item.classList.add("dragging");
            if (boardListContainer) boardListContainer.classList.add("is-reordering");
            if (navigator.vibrate) navigator.vibrate(40);

            item.style.transform = `translate3d(0, 0px, 0) scale(1.03)`;

            window.addEventListener("mousemove", onMoveHandler, { passive: false });
            window.addEventListener("touchmove", onMoveHandler, { passive: false });
            window.addEventListener("mouseup", onEndHandler);
            window.addEventListener("touchend", onEndHandler);
            window.addEventListener("touchcancel", onEndHandler);
        }, 350);
    };

    const cancelTimerHandler = (e) => {
        if (!isDragging && pressTimer) {
            const currentY = e.type.startsWith('touch') ? (e.touches[0] ? e.touches[0].clientY : 0) : e.clientY;
            if (Math.abs(currentY - startY) > 8) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        }
    };

    const onMoveHandler = (e) => {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault();

        const currentY = e.type.startsWith('touch') ? (e.touches[0] ? e.touches[0].clientY : 0) : e.clientY;
        
        const currentLayoutTop = item.offsetTop;
        const deltaY = (currentY - dragStartY) - (currentLayoutTop - initialLayoutTop);
        item.style.transform = `translate3d(0, ${deltaY}px, 0) scale(1.03)`;

        const siblings = [...boardListContainer.querySelectorAll(".board-item:not(.dragging)")];
        let nextSibling = siblings.find(sibling => {
            const box = sibling.getBoundingClientRect();
            return currentY < box.top + box.height / 2;
        });

        if (nextSibling) {
            if (nextSibling !== item.nextSibling) {
                boardListContainer.insertBefore(item, nextSibling);
            }
        } else {
            if (item.nextSibling !== null) {
                boardListContainer.appendChild(item);
            }
        }
    };

    const onEndHandler = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }

        if (isDragging) {
            isDragging = false;
            item.classList.remove("dragging");
            item.style.transform = "";
            if (boardListContainer) boardListContainer.classList.remove("is-reordering");

            window.removeEventListener("mousemove", onMoveHandler);
            window.removeEventListener("touchmove", onMoveHandler);
            window.removeEventListener("mouseup", onEndHandler);
            window.removeEventListener("touchend", onEndHandler);
            window.removeEventListener("touchcancel", onEndHandler);

            const newOrderList = Array.from(boardListContainer.querySelectorAll(".board-item"))
                .map(el => el.dataset.boardId)
                .filter(Boolean);

            saveBoardOrder(newOrderList);

            setTimeout(() => {
                isReorderDrag = false;
            }, 100);
        } else {
            isReorderDrag = false;
        }
    };

    const endPressHandler = () => {
        if (!isDragging && pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    };

    item.addEventListener("mousedown", startDragHandler);
    item.addEventListener("mousemove", cancelTimerHandler);
    item.addEventListener("mouseup", endPressHandler);
    item.addEventListener("mouseleave", endPressHandler);

    item.addEventListener("touchstart", startDragHandler, { passive: true });
    item.addEventListener("touchmove", cancelTimerHandler, { passive: true });
    item.addEventListener("touchend", endPressHandler);
    item.addEventListener("touchcancel", endPressHandler);

    // 3. 수정 버튼 클릭 (보드 정보 수정 모달 팝업)
    const btnEdit = item.querySelector(".btn-edit-board");
    if (btnEdit) {
        btnEdit.addEventListener("mousedown", (e) => e.stopPropagation());
        btnEdit.addEventListener("mouseup", (e) => e.stopPropagation());
        btnEdit.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
        btnEdit.addEventListener("touchend", (e) => e.stopPropagation(), { passive: true });

        btnEdit.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            openBoardEditModal(board);
        });
    }

    // 4. 삭제 버튼 클릭 (완전 삭제 - 편집 권한 보유 시에만 작동)
    if (isLocal && hasPermission) {
        const btnDelete = item.querySelector(".btn-delete-board");
        if (btnDelete) {
            btnDelete.addEventListener("mousedown", (e) => e.stopPropagation());
            btnDelete.addEventListener("mouseup", (e) => e.stopPropagation());
            btnDelete.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
            btnDelete.addEventListener("touchend", (e) => e.stopPropagation(), { passive: true });

            btnDelete.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                deleteTargetBoardId = board.id;
                deleteTargetIndex = null;
                deleteConfirmText.textContent = `'${board.title}' 판을 삭제하시겠습니까?\n(실제 데이터와 스티커가 모두 영구 삭제됩니다.)`;
                modalDelete.classList.remove("hidden");
            });
        }
    }

    return item;
}

// ==========================================
// 6. UI 업데이트 및 렌더링 로직
// ==========================================

let realtimeChannel = null;
function setupRealtimeSubscription(boardId) {
    if (!supabaseClient || !boardId || isLocalMode) return;
    if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
        realtimeChannel = null;
    }
    try {
        realtimeChannel = supabaseClient
            .channel(`public:praise_stickers:${boardId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'praise_stickers', filter: `board_id=eq.${boardId}` },
                (payload) => {
                    const newRecord = payload.new;
                    if (newRecord && newRecord.sticker_index === 999) {
                        const match = (newRecord.memo || "").match(/\[theme:(#[0-9A-Fa-f]{6})\]/);
                        if (match) {
                            applyThemeColor(match[1], false);
                        }
                    } else {
                        refreshApp();
                    }
                }
            )
            .subscribe();
    } catch (e) {
        console.warn("Realtime 구독 설정 에러:", e);
    }
}

// 현재 화면 리프레시
async function refreshApp() {
    try {
        // 1. 보드 정보 로드
        let board = await apiGetBoard(currentBoardId);
        if (!board) {
            // 요청한 currentBoardId가 DB에 없는 경우, 고양이 보드 전체 목록 중 첫 번째 보드로 자동 전환 시도
            const allCatBoards = await apiGetAllBoards();
            if (allCatBoards && allCatBoards.length > 0) {
                board = allCatBoards[0];
                currentBoardId = board.id;
                localStorage.setItem("current_board_id", currentBoardId);
            }
        }
        if (!board) {
            // 보드가 존재하지 않음 -> 초기 설정 화면 노출
            appContent.classList.add("hidden");
            welcomeScreen.classList.remove("hidden");
            
            // 접속 화면 카드를 노출하고 생성 화면 카드를 숨김
            if (welcomeConnectCard) welcomeConnectCard.classList.remove("hidden");
            if (welcomeCreateCard) welcomeCreateCard.classList.add("hidden");
            if (welcomeInputBoardId) welcomeInputBoardId.value = "";
            
            // 설정 폼에 현재 보드 ID 자동 완성 및 테스트값 미리 채우기
            if (currentBoardId === "DEFAULT" || currentBoardId.startsWith("TEST-")) {
                setupBoardId.value = currentBoardId === "DEFAULT" ? "TEST-COSMIC-BOARD" : currentBoardId;
                setupTitle.value = "TEST";
                setupTargetCount.value = "30";
                setupReward.value = "맛있는 디저트 데이트! 🍦";
                setupPin.value = "1234";
            } else {
                setupBoardId.value = currentBoardId;
            }
            return;
        }

        // 보드가 정상적으로 로드된 경우 설정창 숨기고 콘텐츠 노출
        welcomeScreen.classList.add("hidden");
        currentBoard = board;
        if (board && board.editor_pin) {
            localStorage.setItem(`board_pin_${board.id}`, board.editor_pin);
        }
        setupRealtimeSubscription(board.id);

        // 로컬 보드 목록 관리 및 갱신
        addRegisteredBoard(board.id, board.title, board.reward_text);
        renderBoardList();

        // 2. 스티커 정보 로드
        const rawStickers = await apiGetStickers(currentBoardId);

        // 2.5 테마 메타데이터(sticker_index === 999) 감지 및 즉시 적용
        const themeMeta = rawStickers.find(s => s.sticker_index === 999);
        let activeThemeColor = (currentBoard && currentBoard.theme_color) || localStorage.getItem(`board_theme_color_${currentBoardId}`) || "#0284C7";
        if (themeMeta && themeMeta.memo) {
            const match = themeMeta.memo.match(/\[theme:(#[0-9A-Fa-f]{6})\]/);
            if (match) {
                activeThemeColor = match[1];
                localStorage.setItem(`board_theme_color_${currentBoardId}`, activeThemeColor);
                if (currentBoard) currentBoard.theme_color = activeThemeColor;
            }
        }
        applyThemeColor(activeThemeColor, false);

        // 실제 보드에 표시할 스티커만 필터링 (index < 100)
        currentStickers = rawStickers.filter(s => s.sticker_index < 100);
        const activeIndices = new Set(currentStickers.map(s => s.sticker_index));

        // 3. 헤더 및 요약 카드 업데이트
        boardTitle.textContent = currentBoard.title;
        boardCodeDisplay.textContent = `보상: ${currentBoard.reward_text || '없음'}`;

        const targetCount = currentBoard.target_count;
        const completedCount = currentStickers.length;
        progressCount.textContent = `${completedCount} / ${targetCount} 개`;

        const percentage = Math.min((completedCount / targetCount) * 100, 100);
        progressBarFill.style.width = `${percentage}%`;

        // 축하 배너 처리
        if (completedCount >= targetCount) {
            celebrationRewardDetail.textContent = `${currentBoard.reward_text}을(를) 획득할 시간이에요! 🎁`;
            celebrationBanner.classList.remove("hidden");
        } else {
            celebrationBanner.classList.add("hidden");
        }

        // 4. 스티커 판 격자 그리기 (개수가 보존되어 있으면 DOM을 파괴하지 않고 상태만 개별 갱신하여 깜빡임 완전 방지)
        const existingSlots = Array.from(stickerGrid.children);
        if (existingSlots.length !== targetCount) {
            stickerGrid.innerHTML = "";
            for (let i = 0; i < targetCount; i++) {
                const slot = createSlotElement(i);
                stickerGrid.appendChild(slot);
            }
        }

        const currentSlotElements = stickerGrid.children;
        for (let i = 0; i < targetCount; i++) {
            const slot = currentSlotElements[i];
            if (!slot) continue;

            const stickerData = currentStickers.find(s => s.sticker_index === i);
            const isActive = !!stickerData;
            const rawMemo = stickerData && stickerData.memo ? stickerData.memo : "";

            const prevActive = slot.classList.contains("active");
            const prevMemo = slot.getAttribute("data-memo") || "";

            // 상태가 변경되었거나 내용이 비어있는 경우에만 부분 개별 갱신
            if (prevActive !== isActive || prevMemo !== rawMemo || !slot.hasChildNodes()) {
                slot.className = `grid-slot ${isActive ? "active" : ""}`;
                slot.setAttribute("data-memo", rawMemo);
                slot.innerHTML = `
                    ${getCatStickerSvg(i, isActive, rawMemo)}
                    <span class="slot-number">${i + 1}</span>
                `;
            }
        }

        // 5. 모달 내의 필드 업데이트 (현재 설정 대입)
        let savedAppTitle = (currentBoard && currentBoard.app_title) || localStorage.getItem(`app_title_${currentBoardId}`) || localStorage.getItem("global_app_title") || "수산시장 칭찬나라 🐟";
        if (savedAppTitle.indexOf("야옹이") !== -1) {
            savedAppTitle = "수산시장 칭찬나라 🐟";
            localStorage.setItem("global_app_title", savedAppTitle);
        }
        if (appMainLogo) appMainLogo.textContent = savedAppTitle;
        if (editAppTitle) editAppTitle.value = savedAppTitle;
        if (editReaderName) editReaderName.value = currentBoard.reader_role_name || "여자친구 모드 (조회 전용)";
        if (editEditorName) editEditorName.value = currentBoard.editor_role_name || "남자친구 모드 (부착 가능)";
        if (editPin) editPin.value = (currentBoard && currentBoard.editor_pin) || localStorage.getItem(`board_pin_${currentBoardId}`) || "1234";

        // 컨텐츠 표출
        appContent.classList.remove("hidden");
    } catch (err) {
        console.error("refreshApp 실행 중 오류 발생:", err);
    } finally {
        // 로딩 종료 보장
        loadingSpinner.classList.add("hidden");
    }
}

// 단일 슬롯 DOM 요소 생성 헬퍼
function createSlotElement(i) {
    const slot = document.createElement("div");
    slot.className = "grid-slot";

    let pressTimer = null;
    let preventClick = false;

    const startPress = (e) => {
        if (e.type === 'mousedown' && e.button !== 0) return;
        preventClick = false;
        pressTimer = setTimeout(() => {
            preventClick = true;
            const stickerData = currentStickers.find(s => s.sticker_index === i);
            handleSlotLongPress(i, !!stickerData);
        }, 600);
    };

    const cancelPress = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    };

    const endPress = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    };

    slot.addEventListener("mousedown", startPress);
    slot.addEventListener("mouseup", endPress);
    slot.addEventListener("mouseleave", cancelPress);

    slot.addEventListener("touchstart", startPress, { passive: true });
    slot.addEventListener("touchend", endPress, { passive: true });
    slot.addEventListener("touchcancel", cancelPress, { passive: true });
    slot.addEventListener("touchmove", cancelPress, { passive: true });

    slot.addEventListener("click", (e) => {
        if (preventClick) {
            e.preventDefault();
            preventClick = false;
            return;
        }
        const stickerData = currentStickers.find(s => s.sticker_index === i);
        handleSlotClick(i, !!stickerData);
    });

    return slot;
}

// 날짜 포맷 함수
function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}년 ${month}월 ${date}일 ${hours}:${minutes}`;
}

// 스티커 슬롯 클릭 제어 (짧은 클릭: 메모 작성 또는 조회)
async function handleSlotClick(index, isActive) {
    if (isActive) {
        // 이미 붙은 스티커 클릭 시: 메모 모달창 노출
        editTargetIndex = index;
        const sticker = currentStickers.find(s => s.sticker_index === index);
        const rawMemo = sticker && sticker.memo ? sticker.memo : "";
        const parsed = parseStickerMemo(rawMemo);
        
        const displayMemoText = parsed.memo ? parsed.memo : "등록된 칭찬 메모가 없습니다. 🧸";
        const createdDate = sticker && sticker.created_at ? formatDate(sticker.created_at) : "";
        const updatedDate = sticker && sticker.updated_at ? formatDate(sticker.updated_at) : "";

        // 최초 생성 시간과 최근 수정 시간의 차이가 5초 이상인 경우에만 실제 수정된 것으로 간주
        const createdTime = sticker && sticker.created_at ? new Date(sticker.created_at).getTime() : 0;
        const updatedTime = sticker && sticker.updated_at ? new Date(sticker.updated_at).getTime() : 0;
        const isModified = createdTime && updatedTime && Math.abs(updatedTime - createdTime) > 5000;

        viewStickerMemoText.textContent = displayMemoText;
        viewStickerCreatedAt.textContent = createdDate ? `최초 작성: ${createdDate}` : "";
        
        if (updatedDate && isModified) {
            viewStickerUpdatedAt.textContent = `최근 수정: ${updatedDate}`;
            viewStickerUpdatedAt.classList.remove("hidden");
        } else {
            viewStickerUpdatedAt.textContent = "";
            viewStickerUpdatedAt.classList.add("hidden");
        }

        // 수정/저장 관련 UI 초기화
        document.querySelector("#modal-memo-view .memo-view-content").classList.remove("hidden");
        memoEditArea.classList.add("hidden");
        btnMemoEditCancel.classList.add("hidden");
        btnMemoEditSave.classList.add("hidden");
        btnMemoViewClose.classList.remove("hidden");

        if (isEditorMode) {
            btnMemoEditStart.classList.remove("hidden");
        } else {
            btnMemoEditStart.classList.add("hidden");
        }

        modalMemoView.classList.remove("hidden");
    } else {
        // 빈칸 클릭 시: 편집자만 스티커 선택 & 메모 작성 모달 노출
        if (!isEditorMode) {
            showToast("스티커 추가는 남자친구(관리자)만 가능해요! 🐟");
            return;
        }
        memoTargetIndex = index;
        selectedStickerType = index % 10; // 기본 선택 스티커
        inputStickerMemo.value = "";
        
        renderStickerPickerGrid();
        
        modalMemoInput.classList.remove("hidden");
        inputStickerMemo.focus();
    }
}

// 스티커 슬롯 롱프레스 제어 (길게 누르기: 스티커 떼기)
async function handleSlotLongPress(index, isActive) {
    if (!isActive) return; // 빈칸은 롱프레스 무시

    if (!isEditorMode) {
        showToast("스티커 제거는 남자친구(관리자)만 가능해요! 🐟");
        return;
    }

    deleteTargetIndex = index;
    deleteConfirmText.textContent = `스티커를 떼겠습니까?`;
    modalDelete.classList.remove("hidden");
}

// ==========================================
// 7. 역할 모드 토글 (인증 및 로그아웃)
// ==========================================
function updateRoleUI() {
    const globalReaderName = localStorage.getItem("global_reader_role_name");
    const globalEditorName = localStorage.getItem("global_editor_role_name");

    if (isEditorMode) {
        if (btnToggleRole) btnToggleRole.className = "sidebar-role-btn editor-mode";
        if (roleIcon) roleIcon.textContent = "edit";
        if (roleText) roleText.textContent = globalEditorName || (currentBoard && currentBoard.editor_role_name) || "남자친구 모드 (부착 가능)";

        // 설정 모달 내 필드 활성화
        document.querySelectorAll(".editor-only-field").forEach(el => el.disabled = false);
        btnSettingsSave.classList.remove("hidden");
    } else {
        if (btnToggleRole) btnToggleRole.className = "sidebar-role-btn reader-mode";
        if (roleIcon) roleIcon.textContent = "visibility";
        if (roleText) roleText.textContent = globalReaderName || (currentBoard && currentBoard.reader_role_name) || "여자친구 모드 (조회 전용)";

        // 설정 모달 내 필드 비활성화
        document.querySelectorAll(".editor-only-field").forEach(el => el.disabled = true);
        btnSettingsSave.classList.add("hidden");
    }
}

// ==========================================
// 8. 다이얼로그 모달 상호작용 및 이벤트 리스너
// ==========================================

// 토스트 메시지 띄우기
let toastTimeout = null;
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    toast.style.opacity = 1;

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.style.opacity = 0;
        setTimeout(() => toast.classList.add("hidden"), 300);
    }, 2500);
}

// PIN 번호 확인 처리
btnPinSubmit.addEventListener("click", () => {
    const pin = inputPin.value.trim();
    const requiredPin = (currentBoard && currentBoard.editor_pin) || localStorage.getItem(`board_pin_${currentBoardId}`) || "1234";

    if (pin === requiredPin) {
        isEditorMode = true;
        localStorage.setItem("is_editor", "true");
        localStorage.setItem(`board_pin_${currentBoardId}`, pin);
        inputPin.value = "";
        pinError.classList.add("hidden");
        modalPin.classList.add("hidden");
        updateRoleUI();
        refreshApp();
        showToast("남자친구 편집 권한이 승인되었습니다! 🐟");
    } else {
        pinError.classList.remove("hidden");
    }
});

btnPinCancel.addEventListener("click", () => {
    inputPin.value = "";
    pinError.classList.add("hidden");
    modalPin.classList.add("hidden");
});

// 역할 전환 버튼
btnToggleRole.addEventListener("click", () => {
    if (isEditorMode) {
        isEditorMode = false;
        localStorage.removeItem("is_editor"); // 로그아웃 시 전역 인증 승인 기록 삭제
        updateRoleUI();
        refreshApp();
        showToast("조회 전용 모드로 복귀했습니다.");
    } else {
        modalPin.classList.remove("hidden");
        inputPin.focus();
    }
});

// 새 칭찬판 만들기 다이얼로그 노출
if (btnShare) {
    btnShare.addEventListener("click", () => {
        modalShare.classList.remove("hidden");
        inputCreateBoardTitle.value = "";
        inputCreateBoardTitle.focus();
    });
}

btnShareClose.addEventListener("click", () => {
    modalShare.classList.add("hidden");
});

// 새로운 칭찬판 생성 (마지막 숫자 + 1 순차적 코드 자동 생성)
btnCreateBoard.addEventListener("click", async () => {
    const titleVal = inputCreateBoardTitle.value.trim();
    const finalTitle = titleVal || "수산시장 칭찬판 🐟";

    loadingSpinner.classList.remove("hidden");
    modalShare.classList.add("hidden");

    // 순차적 보드 코드 생성 (마지막 숫자 + 1, 예: CAT_BOARD_001 -> CAT_BOARD_002)
    const finalCode = await getNextSequentialBoardCode();

    const activeColor = (currentBoard && currentBoard.theme_color) || localStorage.getItem(`board_theme_color_${currentBoardId}`) || "#0284C7";
    const activePin = (currentBoard && currentBoard.editor_pin) || localStorage.getItem(`board_pin_${currentBoardId}`) || "1234";

    const newBoard = {
        id: finalCode,
        title: finalTitle,
        target_count: 30,
        reward_text: "싱싱한 모둠회 세트 먹으러 가기 🐟",
        editor_pin: activePin,
        reader_role_name: "여자친구 모드 (조회 전용)",
        editor_role_name: "남자친구 모드 (부착 가능)",
        created_at: new Date().toISOString()
    };

    const success = await apiCreateBoard(newBoard);
    if (success) {
        currentBoardId = finalCode;
        localStorage.setItem("current_board_id", finalCode);
        localStorage.setItem(`board_pin_${finalCode}`, activePin);
        localStorage.setItem(`board_theme_color_${finalCode}`, activeColor);
        await apiSaveThemeColor(finalCode, activeColor);
        localStorage.setItem("is_editor", "true");
        inputCreateBoardTitle.value = "";
        isEditorMode = true;
        updateRoleUI();
        await refreshApp();
        
        showToast("새 수산시장 칭찬판이 생성되었습니다! 🐟");
    } else {
        showToast("칭찬판 개설에 실패했습니다.");
        loadingSpinner.classList.add("hidden");
        modalShare.classList.remove("hidden");
    }
});

// 설정 다이얼로그 노출/숨김
btnSettings.addEventListener("click", () => {
    modalSettings.classList.remove("hidden");
});

btnSettingsClose.addEventListener("click", () => {
    modalSettings.classList.add("hidden");
});

// 칭찬판 코드 스위칭
btnSwitchBoard.addEventListener("click", async () => {
    const code = inputSwitchBoard.value.trim().toUpperCase();
    if (!code) {
        showToast("코드를 입력해 주세요.");
        return;
    }

    loadingSpinner.classList.remove("hidden");
    modalSettings.classList.add("hidden");

    const board = await apiGetBoard(code);
    if (board) {
        currentBoardId = code;
        localStorage.setItem("current_board_id", code);
        inputSwitchBoard.value = "";
        isEditorMode = localStorage.getItem("is_editor") === "true"; // 전역 인증 상태 유지
        updateRoleUI();
        await refreshApp();
        showToast(`칭찬판 '${board.title}'을 성공적으로 불러왔습니다!`);
    } else {
        showToast("존재하지 않는 칭찬판 공유 코드입니다.");
        loadingSpinner.classList.add("hidden");
        modalSettings.classList.remove("hidden");
    }
});

// 칭찬판 세부 설정 변경 및 저장 (보안 및 라벨 전용)
btnSettingsSave.addEventListener("click", async () => {
    if (!isEditorMode) return;

    loadingSpinner.classList.remove("hidden");
    modalSettings.classList.add("hidden");

    const newAppTitle = editAppTitle ? editAppTitle.value.trim() : "";
    const newPin = editPin.value.trim();
    const newReaderName = editReaderName.value.trim();
    const newEditorName = editEditorName.value.trim();

    if (newAppTitle) {
        localStorage.setItem(`app_title_${currentBoardId}`, newAppTitle);
        localStorage.setItem("global_app_title", newAppTitle);
        if (appMainLogo) appMainLogo.textContent = newAppTitle;
    }
    if (newPin) localStorage.setItem(`board_pin_${currentBoardId}`, newPin);
    if (newReaderName) localStorage.setItem("global_reader_role_name", newReaderName);
    if (newEditorName) localStorage.setItem("global_editor_role_name", newEditorName);

    const updated = {
        ...currentBoard,
        app_title: newAppTitle || (currentBoard && currentBoard.app_title) || "수산시장 칭찬나라 🐟",
        editor_pin: newPin || (currentBoard && currentBoard.editor_pin) || "1234",
        reader_role_name: newReaderName || (currentBoard && currentBoard.reader_role_name) || "여자친구 모드 (조회 전용)",
        editor_role_name: newEditorName || (currentBoard && currentBoard.editor_role_name) || "남자친구 모드 (부착 가능)"
    };

    const success = await apiCreateBoard(updated);
    if (success) {
        currentBoard = updated;
        await refreshApp();
        showToast("칭찬판 보안 및 라벨 설정이 변경되었습니다. ✨");
    } else {
        showToast("설정 저장에 실패했습니다.");
        loadingSpinner.classList.add("hidden");
        modalSettings.classList.remove("hidden");
    }
});

// 칭찬판 정보 수정 저장 처리 (길게 누르기 모달)
btnBoardEditSave.addEventListener("click", async () => {
    if (!editTargetBoard) return;
    const hasPermission = localStorage.getItem("is_editor") === "true";
    if (!hasPermission) return;

    const count = parseInt(editBoardTargetCount.value);
    if (isNaN(count) || count < 1 || count > 100) {
        showToast("올바른 목표 개수(1~100)를 입력하세요.");
        return;
    }

    loadingSpinner.classList.remove("hidden");
    if (modalBoardEdit) modalBoardEdit.classList.add("hidden");

    const updatedBoard = {
        ...editTargetBoard,
        title: editBoardTitle.value.trim() || editTargetBoard.title,
        target_count: count,
        reward_text: editBoardReward.value.trim()
    };

    const success = await apiCreateBoard(updatedBoard);
    if (success) {
        // 로컬 레지스트리 목록 캐시 이름 및 보상 갱신
        addRegisteredBoard(editTargetBoard.id, updatedBoard.title, updatedBoard.reward_text);

        if (editTargetBoard.id === currentBoardId) {
            currentBoard = updatedBoard;
            await refreshApp();
        } else {
            renderBoardList();
            loadingSpinner.classList.add("hidden");
        }
        showToast("칭찬판이 성공적으로 수정되었습니다! ✨");
        editTargetBoard = null;
    } else {
        showToast("설정 저장에 실패했습니다.");
        loadingSpinner.classList.add("hidden");
        if (modalBoardEdit) modalBoardEdit.classList.remove("hidden");
    }
});

btnBoardEditClose.addEventListener("click", () => {
    editTargetBoard = null;
    if (modalBoardEdit) modalBoardEdit.classList.add("hidden");
});

// 스티커 제거 또는 스티커판 삭제 확인 처리
btnDeleteConfirm.addEventListener("click", async () => {
    loadingSpinner.classList.remove("hidden");
    modalDelete.classList.add("hidden");

    // (A) 스티커판(보드) 삭제 처리
    if (deleteTargetBoardId) {
        const boardIdToDelete = deleteTargetBoardId;
        deleteTargetBoardId = null;
        const wasActive = boardIdToDelete === currentBoardId;

        await apiDeleteBoard(boardIdToDelete);
        removeRegisteredBoard(boardIdToDelete);

        if (wasActive) {
            sidebar.classList.remove("open");
            sidebarOverlay.classList.add("hidden");
            isEditorMode = localStorage.getItem("is_editor") === "true";
            updateRoleUI();
            const newUrl = `${window.location.origin}${window.location.pathname}?board=${currentBoardId}`;
            window.history.replaceState({ path: newUrl }, "", newUrl);
            await refreshApp();
        } else {
            renderBoardList();
            loadingSpinner.classList.add("hidden");
        }
        showToast("스티커판이 완전히 삭제되었습니다.");
        return;
    }

    // (B) 스티커 제거 처리
    if (deleteTargetIndex === null) {
        loadingSpinner.classList.add("hidden");
        return;
    }

    const success = await apiRemoveSticker(currentBoardId, deleteTargetIndex);
    if (success) {
        showToast(`${deleteTargetIndex + 1}번째 스티커를 제거했습니다.`);
        deleteTargetIndex = null;
        await refreshApp();
    } else {
        showToast("스티커 제거 실패");
        loadingSpinner.classList.add("hidden");
    }
});

btnDeleteCancel.addEventListener("click", () => {
    deleteTargetIndex = null;
    deleteTargetBoardId = null;
    modalDelete.classList.add("hidden");
});

// 칭찬 메모 입력 모달 이벤트 리스너
btnMemoSubmit.addEventListener("click", async () => {
    if (memoTargetIndex === null) return;
    const memoText = inputStickerMemo.value.trim();
    const formattedMemo = `[type:${selectedStickerType}] ${memoText}`;

    loadingSpinner.classList.remove("hidden");
    modalMemoInput.classList.add("hidden");

    const success = await apiAddSticker(currentBoardId, memoTargetIndex, formattedMemo);
    if (success) {
        const pawName = CAT_PAWS[selectedStickerType] ? CAT_PAWS[selectedStickerType].name : "고양이 젤리";
        showToast(`${memoTargetIndex + 1}번째 칸에 ${pawName} 스티커 부착 완료! 🐾💖`);
        memoTargetIndex = null;
        await refreshApp();
    } else {
        showToast("스티커 부착 중 에러가 발생했습니다.");
        loadingSpinner.classList.add("hidden");
    }
});

btnMemoCancel.addEventListener("click", () => {
    memoTargetIndex = null;
    modalMemoInput.classList.add("hidden");
});

// 칭찬 메모 확인 모달 이벤트 리스너
btnMemoViewClose.addEventListener("click", () => {
    editTargetIndex = null;
    modalMemoView.classList.add("hidden");
});

// 메모 수정 시작
btnMemoEditStart.addEventListener("click", () => {
    if (editTargetIndex === null) return;
    const sticker = currentStickers.find(s => s.sticker_index === editTargetIndex);
    const parsed = parseStickerMemo(sticker && sticker.memo ? sticker.memo : "");
    inputEditStickerMemo.value = parsed.memo;
    
    // UI 전환
    document.querySelector("#modal-memo-view .memo-view-content").classList.add("hidden");
    memoEditArea.classList.remove("hidden");
    
    btnMemoEditStart.classList.add("hidden");
    btnMemoViewClose.classList.add("hidden");
    btnMemoEditCancel.classList.remove("hidden");
    btnMemoEditSave.classList.remove("hidden");
    
    inputEditStickerMemo.focus();
});

// 메모 수정 취소
btnMemoEditCancel.addEventListener("click", () => {
    document.querySelector("#modal-memo-view .memo-view-content").classList.remove("hidden");
    memoEditArea.classList.add("hidden");
    
    btnMemoEditStart.classList.remove("hidden");
    btnMemoViewClose.classList.remove("hidden");
    btnMemoEditCancel.classList.add("hidden");
    btnMemoEditSave.classList.add("hidden");
});

// 메모 수정 저장
btnMemoEditSave.addEventListener("click", async () => {
    if (editTargetIndex === null) return;
    const newMemoText = inputEditStickerMemo.value.trim();
    
    const sticker = currentStickers.find(s => s.sticker_index === editTargetIndex);
    const parsed = parseStickerMemo(sticker ? sticker.memo : "");
    const keepType = parsed.type !== null ? parsed.type : (editTargetIndex % 10);
    const formattedMemo = `[type:${keepType}] ${newMemoText}`;

    loadingSpinner.classList.remove("hidden");
    modalMemoView.classList.add("hidden");
    
    const success = await apiUpdateStickerMemo(currentBoardId, editTargetIndex, formattedMemo);
    if (success) {
        showToast("칭찬 메모가 수정되었습니다. ✨");
        editTargetIndex = null;
        await refreshApp();
    } else {
        showToast("메모 수정에 실패했습니다.");
        loadingSpinner.classList.add("hidden");
        modalMemoView.classList.remove("hidden");
    }
});

// 모든 모달 배경(바탕/어두운 영역) 클릭 시 모달 닫기 이벤트 핸들러
document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            overlay.classList.add("hidden");
            
            if (overlay.id === "modal-memo-view") {
                editTargetIndex = null;
                const memoViewContent = document.querySelector("#modal-memo-view .memo-view-content");
                if (memoViewContent) memoViewContent.classList.remove("hidden");
                if (memoEditArea) memoEditArea.classList.add("hidden");
                if (btnMemoEditCancel) btnMemoEditCancel.classList.add("hidden");
                if (btnMemoEditSave) btnMemoEditSave.classList.add("hidden");
                if (btnMemoViewClose) btnMemoViewClose.classList.remove("hidden");
            } else if (overlay.id === "modal-memo-input") {
                memoTargetIndex = null;
            } else if (overlay.id === "modal-delete") {
                deleteTargetIndex = null;
                deleteTargetBoardId = null;
            } else if (overlay.id === "modal-pin") {
                const pinError = document.getElementById("pin-error");
                if (pinError) pinError.classList.add("hidden");
            }
        }
    });
});
// ==========================================
// 8.5 RGB 색상 팔레트 및 전역 테마 처리 헬퍼
// ==========================================
function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

function rgbToHex(r, g, b) {
    const toHex = (c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function adjustColorBrightness(hex, percent) {
    const { r, g, b } = hexToRgb(hex);
    const adjust = (val) => Math.max(0, Math.min(255, Math.round(val + (255 * (percent / 100)))));
    return rgbToHex(adjust(r), adjust(g), adjust(b));
}

function updatePaletteUI(hex) {
    if (!hex) hex = "#0284C7";
    hex = hex.toUpperCase();
    const { r, g, b } = hexToRgb(hex);

    if (rangeR) rangeR.value = r;
    if (rangeG) rangeG.value = g;
    if (rangeB) rangeB.value = b;
    if (valR) valR.textContent = r;
    if (valG) valG.textContent = g;
    if (valB) valB.textContent = b;
    if (inputCustomColor) inputCustomColor.value = hex;

    if (colorPreviewBox) colorPreviewBox.style.backgroundColor = hex;
    if (colorPreviewText) colorPreviewText.textContent = hex;

    const presetBtns = document.querySelectorAll(".color-preset-btn");
    presetBtns.forEach(btn => {
        if (btn.getAttribute("data-color").toUpperCase() === hex) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

function applyThemeColor(hex, save = false) {
    if (!hex) hex = "#0284C7";
    hex = hex.toUpperCase();

    const darkHex = adjustColorBrightness(hex, -25);
    const lightHex = adjustColorBrightness(hex, 85);
    const bgStart = adjustColorBrightness(hex, 75);
    const bgEnd = adjustColorBrightness(hex, 60);
    const { r, g, b } = hexToRgb(hex);
    const glowStr = `rgba(${r}, ${g}, ${b}, 0.35)`;

    document.documentElement.style.setProperty("--stitch-primary", hex);
    document.documentElement.style.setProperty("--stitch-primary-dark", darkHex);
    document.documentElement.style.setProperty("--stitch-primary-light", lightHex);
    document.documentElement.style.setProperty("--stitch-bg-gradient-start", bgStart);
    document.documentElement.style.setProperty("--stitch-bg-gradient-end", bgEnd);
    document.documentElement.style.setProperty("--stitch-glow", glowStr);

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute("content", hex);

    if (save && currentBoardId) {
        localStorage.setItem(`board_theme_color_${currentBoardId}`, hex);
        if (currentBoard) {
            currentBoard.theme_color = hex;
        }
        apiSaveThemeColor(currentBoardId, hex);
    }
}

// 팔레트 모달 이벤트 핸들러 바인딩
if (btnColorPalette) {
    btnColorPalette.addEventListener("click", () => {
        if (!isEditorMode) {
            modalPin.classList.remove("hidden");
            if (inputPin) inputPin.focus();
            showToast("테마 색상 변경은 편집자 권한(비밀번호 PIN 인증)이 필요합니다. 🔒");
            return;
        }
        const savedColor = (currentBoard && currentBoard.theme_color) || localStorage.getItem(`board_theme_color_${currentBoardId}`) || "#0284C7";
        updatePaletteUI(savedColor);
        modalColorPalette.classList.remove("hidden");
    });
}

if (btnColorClose) {
    btnColorClose.addEventListener("click", () => {
        modalColorPalette.classList.add("hidden");
    });
}

function onRgbSliderChange() {
    const r = parseInt(rangeR.value, 10) || 0;
    const g = parseInt(rangeG.value, 10) || 0;
    const b = parseInt(rangeB.value, 10) || 0;
    const hex = rgbToHex(r, g, b);
    updatePaletteUI(hex);
}

if (rangeR) rangeR.addEventListener("input", onRgbSliderChange);
if (rangeG) rangeG.addEventListener("input", onRgbSliderChange);
if (rangeB) rangeB.addEventListener("input", onRgbSliderChange);

if (inputCustomColor) {
    inputCustomColor.addEventListener("input", (e) => {
        updatePaletteUI(e.target.value);
    });
}

document.querySelectorAll(".color-preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const color = btn.getAttribute("data-color");
        updatePaletteUI(color);
    });
});

if (btnColorReset) {
    btnColorReset.addEventListener("click", () => {
        if (!isEditorMode) {
            showToast("편집 권한이 필요합니다. 🔒");
            return;
        }
        updatePaletteUI("#0284C7");
        applyThemeColor("#0284C7", true);
        showToast("테마 색상이 기본값(#0284C7)으로 초기화되었습니다.");
    });
}

if (btnColorApply) {
    btnColorApply.addEventListener("click", () => {
        if (!isEditorMode) {
            showToast("편집 권한이 필요합니다. 🔒");
            return;
        }
        const r = parseInt(rangeR.value, 10) || 0;
        const g = parseInt(rangeG.value, 10) || 0;
        const b = parseInt(rangeB.value, 10) || 0;
        const hex = rgbToHex(r, g, b);
        applyThemeColor(hex, true);
        modalColorPalette.classList.add("hidden");
        showToast(`테마 색상이 ${hex} (으)로 변경되었습니다! 🎨`);
    });
}

// ==========================================
// 9. 앱 초기 구동 및 실시간 데이터 싱크 폴링
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. 기존 데모/더미 데이터 로컬스토리지 캐시 정리
    localStorage.removeItem("board_DEFAULT");
    localStorage.removeItem("stickers_DEFAULT");

    // [소독 패치] 무효한 데이터 정리 및 유효한 보드 보존
    try {
        const boards = JSON.parse(localStorage.getItem("registered_boards") || "[]");
        if (boards.length > 0) {
            const cleaned = boards.filter(b => b && b.id && typeof b.id === "string");
            if (cleaned.length !== boards.length) {
                localStorage.setItem("registered_boards", JSON.stringify(cleaned));
            }
        }
    } catch (e) {
        console.error("로컬 스토리지 칭찬판 리스트 정리 중 오류:", e);
    }

    // 2. URL 쿼리 파라미터에서 보드 ID가 넘어온 경우 자동 설정
    const urlParams = new URLSearchParams(window.location.search);
    const boardParam = urlParams.get("board");
    if (boardParam) {
        currentBoardId = boardParam.trim().toUpperCase();
        localStorage.setItem("current_board_id", currentBoardId);
        // URL로 진입할 때 전역 인증 상태 복원
        isEditorMode = localStorage.getItem("is_editor") === "true";
    }

    updateRoleUI();
    refreshApp();

    // 사이드바 토글 및 기능 바인딩
    if (btnMenu) {
        btnMenu.addEventListener("click", () => {
            sidebar.classList.add("open");
            sidebarOverlay.classList.remove("hidden");
            renderBoardList(true); // 열릴 때 최신 목록 렌더링
        });
    }

    if (btnSidebarClose) {
        btnSidebarClose.addEventListener("click", () => {
            sidebar.classList.remove("open");
            sidebarOverlay.classList.add("hidden");
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", () => {
            sidebar.classList.remove("open");
            sidebarOverlay.classList.add("hidden");
        });
    }
    
    if (btnAddBoardSidebar) {
        btnAddBoardSidebar.addEventListener("click", () => {
            sidebar.classList.remove("open");
            sidebarOverlay.classList.add("hidden");
            
            // 공유/생성 모달을 열고 새 보드 생성 인풋에 포커싱
            modalShare.classList.remove("hidden");
            inputCreateBoardTitle.value = "";
            inputCreateBoardTitle.focus();
        });
    }

    // 2. 웰컴 스크린 칭찬판 최초 생성 처리
    btnSetupSubmit.addEventListener("click", async () => {
        const code = setupBoardId.value.trim().toUpperCase();
        const title = setupTitle.value.trim();
        const target = parseInt(setupTargetCount.value);
        const reward = setupReward.value.trim();
        const pin = setupPin.value.trim();

        if (!code) {
            showToast("공유 코드를 입력해 주세요.");
            return;
        }
        if (!title) {
            showToast("칭찬판 제목을 입력해 주세요.");
            return;
        }
        if (isNaN(target) || target < 1 || target > 100) {
            showToast("올바른 목표 개수(1~100)를 입력하세요.");
            return;
        }
        if (!pin) {
            showToast("비밀번호 PIN을 입력해 주세요.");
            return;
        }

        loadingSpinner.classList.remove("hidden");
        welcomeScreen.classList.add("hidden");

        const newBoard = {
            id: code,
            title: title,
            target_count: target,
            reward_text: reward,
            editor_pin: pin,
            created_at: new Date().toISOString()
        };

        const success = await apiCreateBoard(newBoard);
        if (success) {
            currentBoardId = code;
            localStorage.setItem("current_board_id", code);
            localStorage.setItem("is_editor", "true"); // 최초 개설 시 로컬에 자동 전역 로그인 세션 활성화
            localStorage.setItem("global_editor_pin", pin);
            // 생성 시에는 자동으로 편집자 모드 승인
            isEditorMode = true;
            updateRoleUI();
            await refreshApp();
            showToast("칭찬판이 성공적으로 개설되었습니다! 🚀");
            
            // 브라우저 주소창 URL 업데이트
            const newUrl = `${window.location.origin}${window.location.pathname}?board=${code}`;
            window.history.replaceState({ path: newUrl }, "", newUrl);
        } else {
            showToast("칭찬판 개설에 실패했습니다.");
            welcomeScreen.classList.remove("hidden");
            loadingSpinner.classList.add("hidden");
        }
    });

    // 3. 웰컴 스크린 접속하기 처리
    if (btnWelcomeConnect) {
        btnWelcomeConnect.addEventListener("click", async () => {
            const code = welcomeInputBoardId.value.trim().toUpperCase();
            if (!code) {
                showToast("공유 코드를 입력해 주세요.");
                return;
            }

            loadingSpinner.classList.remove("hidden");
            const board = await apiGetBoard(code);
            if (board) {
                currentBoardId = code;
                localStorage.setItem("current_board_id", code);
                welcomeInputBoardId.value = "";
                isEditorMode = localStorage.getItem("is_editor") === "true"; // 전역 인증 상태 유지
                updateRoleUI();
                await refreshApp();
                showToast(`칭찬판 '${board.title}'을 성공적으로 불러왔습니다!`);
                
                // 브라우저 주소창 URL 업데이트
                const newUrl = `${window.location.origin}${window.location.pathname}?board=${code}`;
                window.history.replaceState({ path: newUrl }, "", newUrl);
            } else {
                showToast("존재하지 않는 칭찬판 공유 코드입니다.");
                loadingSpinner.classList.add("hidden");
            }
        });
    }

    // 4. 웰컴 스크린 새 스티커판 만들기 화면 전환
    if (btnWelcomeShowCreate) {
        btnWelcomeShowCreate.addEventListener("click", async () => {
            loadingSpinner.classList.remove("hidden");

            // 고유한 순차 코드 생성 (예: CAT-BOARD_1)
            const finalCode = await getNextSequentialBoardCode();

            setupBoardId.value = finalCode;
            setupTitle.value = "고양이 칭찬판 💖";
            setupTargetCount.value = "30";
            setupReward.value = "맛있는 디저트 데이트! 🍦";
            setupPin.value = "1234";

            if (welcomeConnectCard) welcomeConnectCard.classList.add("hidden");
            if (welcomeCreateCard) welcomeCreateCard.classList.remove("hidden");
            
            loadingSpinner.classList.add("hidden");
        });
    }

    // 5. 웰컴 스크린 생성 화면에서 이전(접속) 화면으로 돌아가기
    if (btnWelcomeBack) {
        btnWelcomeBack.addEventListener("click", () => {
            if (welcomeCreateCard) welcomeCreateCard.classList.add("hidden");
            if (welcomeConnectCard) welcomeConnectCard.classList.remove("hidden");
        });
    }

// 모바일 브라우저 백그라운드/네트워크 3초 자동 동기화 헬퍼 (편집자 테마 색상 및 스티커 실시간 동기화)
let syncInterval = null;
function startAutoSync() {
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(async () => {
        if (!document.hidden && currentBoardId) {
            const rawStickers = await apiGetStickers(currentBoardId);
            const themeMeta = rawStickers.find(s => s.sticker_index === 999);
            if (themeMeta && themeMeta.memo) {
                const match = themeMeta.memo.match(/\[theme:(#[0-9A-Fa-f]{6})\]/);
                if (match) {
                    const remoteColor = match[1];
                    const localColor = localStorage.getItem(`board_theme_color_${currentBoardId}`);
                    if (remoteColor !== localColor) {
                        localStorage.setItem(`board_theme_color_${currentBoardId}`, remoteColor);
                        if (currentBoard) currentBoard.theme_color = remoteColor;
                        applyThemeColor(remoteColor, false);
                    }
                }
            }
        }
    }, 3000);
}

    // 탭 전환 시(앱으로 다시 돌아왔을 때) 1회 자동 동기화
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            refreshApp();
        }
    });

    startAutoSync();
});
