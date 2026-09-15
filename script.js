/* =====================================================
   GYM PRO - SCRIPT.JS
   ===================================================== */

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


document.addEventListener("DOMContentLoaded", function () {

    "use strict";


    /* =====================================================
       AUTH - عناصر الشاشة
    ===================================================== */

    const authScreen =
        document.getElementById("authScreen");

    const appShell =
        document.getElementById("appShell");

    const authTabs =
        document.querySelectorAll("[data-auth-tab]");

    const loginForm =
        document.getElementById("loginForm");

    const signupForm =
        document.getElementById("signupForm");

    const authError =
        document.getElementById("authError");

    const authHint =
        document.getElementById("authHint");

    const loginSubmit =
        document.getElementById("loginSubmit");

    const signupSubmit =
        document.getElementById("signupSubmit");

    const logoutBtn =
        document.getElementById("logoutBtn");
const forgotPasswordLink =
        document.getElementById("forgotPasswordLink");

    function showAuthError(message) {

        if (!authError) return;

        authHint.classList.remove("active");
        authError.textContent = message;
        authError.classList.add("active");
    }


    function showAuthHint(message) {

        if (!authHint) return;

        authError.classList.remove("active");
        authHint.textContent = message;
        authHint.classList.add("active");
    }


    function clearAuthMessages() {

        if (authError) authError.classList.remove("active");
        if (authHint) authHint.classList.remove("active");
    }


    authTabs.forEach(function (tab) {

        tab.addEventListener("click", function () {

            const target =
                tab.getAttribute("data-auth-tab");

            authTabs.forEach(function (t) {
                t.classList.toggle("active", t === tab);
            });

            document
                .getElementById("loginForm")
                .classList.toggle("active", target === "login");

            document
                .getElementById("signupForm")
                .classList.toggle("active", target === "signup");

            clearAuthMessages();

        });

    });


    /* =====================================================
       AUTH - تسجيل الدخول
    ===================================================== */

    if (loginForm) {

        loginForm.addEventListener("submit", async function (event) {

            event.preventDefault();
            clearAuthMessages();

            const email =
                document.getElementById("loginEmail").value.trim();

            const password =
                document.getElementById("loginPassword").value;

            loginSubmit.disabled = true;
            loginSubmit.textContent = "جاري تسجيل الدخول...";

            try {

                const { data, error } =
                    await supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password
                    });

                if (error) {
                    throw error;
                }

                if (data && data.user) {
                    await enterApp(data.user);
                }

            } catch (error) {

                showAuthError(
                    "خطأ: تأكد من البريد الإلكتروني وكلمة المرور"
                );

            } finally {

                loginSubmit.disabled = false;
                loginSubmit.textContent = "تسجيل الدخول";
            }

        });

    }


    /* =====================================================
       AUTH - إنشاء حساب
    ===================================================== */

    if (signupForm) {

        signupForm.addEventListener("submit", async function (event) {

            event.preventDefault();
            clearAuthMessages();

            const name =
                document.getElementById("signupName").value.trim();

            const email =
                document.getElementById("signupEmail").value.trim();

            const password =
                document.getElementById("signupPassword").value;

            signupSubmit.disabled = true;
            signupSubmit.textContent = "جاري إنشاء الحساب...";

            try {

                const { data, error } =
                    await supabaseClient.auth.signUp({
                        email: email,
                        password: password,
                        options: {
                            data: { name: name }
                        }
                    });

                if (error) {
                    throw error;
                }

                if (data && data.user) {

                    // ننشئ صف الملف الشخصي مباشرة بالاسم المدخل
                    await supabaseClient
                        .from("profiles")
                        .upsert({
                            id: data.user.id,
                            name: name
                        });
                }

                if (data && data.session) {

                    // تفعيل الحساب فوري (تأكيد البريد غير مفعّل بالمشروع)
                    await enterApp(data.user);

                } else {

                    showAuthHint(
                        "تم إنشاء الحساب ✅ تحقق من بريدك الإلكتروني لتفعيله ثم سجل الدخول"
                    );

                    authTabs.forEach(function (t) {
                        t.classList.toggle(
                            "active",
                            t.getAttribute("data-auth-tab") === "login"
                        );
                    });

                    loginForm.classList.add("active");
                    signupForm.classList.remove("active");
                }

            } catch (error) {

                showAuthError(
                    error && error.message
                        ? "خطأ: " + error.message
                        : "تعذر إنشاء الحساب، حاول مجدداً"
                );

            } finally {

                signupSubmit.disabled = false;
                signupSubmit.textContent = "إنشاء حساب";
            }

        });

    }


    /* =====================================================
       AUTH - تسجيل الخروج
    ===================================================== */

    if (logoutBtn) {

        logoutBtn.addEventListener("click", async function () {

            await supabaseClient.auth.signOut();
            exitApp();

        });

    }

if (forgotPasswordLink) {

        forgotPasswordLink.addEventListener("click", async function (event) {

            event.preventDefault();

            const email =
                document.getElementById("loginEmail").value.trim();

            if (!email) {
                showAuthError("اكتب بريدك الإلكتروني بالخانة فوق أولاً");
                return;
            }

            try {

                const { error } =
                    await supabaseClient.auth.resetPasswordForEmail(email);

                if (error) {
                    throw error;
                }

                showAuthHint(
                    "تم إرسال رابط إعادة تعيين كلمة المرور لبريدك ✅"
                );

            } catch (error) {

                showAuthError(
                    "تعذر إرسال الرابط، تأكد من البريد الإلكتروني"
                );

            }

        });

    }


    /* =====================================================
       AUTH - التنقل بين الشاشات
    ===================================================== */
    /* =====================================================
       AUTH - التنقل بين الشاشات
    ===================================================== */

    let appHasStarted = false;
   authScreen.classList.add("loading");


    async function enterApp(user) {

        if (appHasStarted) return;
        appHasStarted = true;

        authScreen.style.display = "none";
        appShell.style.display = "block";

        await startApp(user);
    }


    function exitApp() {

        appHasStarted = false;

        appShell.style.display = "none";
        authScreen.style.display = "flex";

        if (loginForm) loginForm.reset();
        if (signupForm) signupForm.reset();

        clearAuthMessages();
    }


    supabaseClient.auth
        .getSession()
        .then(function (result) {

            const session =
                result && result.data
                    ? result.data.session
                    : null;authScreen.classList.remove("loading");

            if (session && session.user) {
                enterApp(session.user);
            }

        });


    /* =====================================================
       MAIN APP - يعمل فقط بعد تسجيل الدخول
    ===================================================== */

    async function startApp(currentUser) {


    /* =====================================================
       DATA
    ===================================================== */

    const machines = [

        {
            id: 1,
            name: "Chest Press",
            category: "chest",
            categoryName: "صدر",
            emoji: "🏋️",
            muscles: "عضلات الصدر والترايسبس",
            description: "ماكينة ضغط الصدر لتقوية عضلات الصدر.",
            setup: "اضبط ارتفاع المقعد بحيث تكون المقابض بمستوى منتصف الصدر.",
            steps: [
                "اجلس على المقعد وظهرك ملاصق للمسند.",
                "أمسك المقابض بكلتا اليدين.",
                "ادفع المقابض إلى الأمام بدون قفل الكوع.",
                "ارجع ببطء إلى وضع البداية."
            ],
            mistakes: "لا تستخدم وزنًا أكبر من قدرتك ولا تجعل الحركة سريعة.",
            safety: "حافظ على ظهرك ملاصقًا للمقعد وتحكم بالوزن."
        },

        {
            id: 2,
            name: "Lat Pulldown",
            category: "back",
            categoryName: "ظهر",
            emoji: "🦍",
            muscles: "عضلات الظهر والبايسبس",
            description: "ماكينة السحب العلوي لتقوية عضلات الظهر.",
            setup: "اضبط المقعد وثبت رجليك تحت الوسادة.",
            steps: [
                "اجلس بشكل مستقيم.",
                "أمسك البار بقبضة أوسع قليلًا من الكتفين.",
                "اسحب البار باتجاه أعلى الصدر.",
                "ارجع بالبار ببطء إلى الأعلى."
            ],
            mistakes: "لا تسحب البار خلف الرقبة ولا تستخدم الدفع بالجسم.",
            safety: "حافظ على الحركة بطيئة ومسيطر عليها."
        },

        {
            id: 3,
            name: "Leg Press",
            category: "legs",
            categoryName: "أرجل",
            emoji: "🦵",
            muscles: "الفخذين والأرداف",
            description: "ماكينة ضغط الأرجل لبناء قوة الجزء السفلي.",
            setup: "اضبط المقعد بحيث تكون الركبتان بوضع مريح.",
            steps: [
                "ضع قدميك على المنصة بعرض الكتفين.",
                "حرر الأمان.",
                "انزل بالوزن بشكل متحكم.",
                "ادفع المنصة حتى تقترب من مد الركبتين."
            ],
            mistakes: "لا تقفل الركبتين ولا تنزل لدرجة تفقد فيها التحكم.",
            safety: "تأكد من قفل الأمان قبل وضع الأوزان."
        },

        {
            id: 4,
            name: "Shoulder Press",
            category: "shoulders",
            categoryName: "أكتاف",
            emoji: "🔥",
            muscles: "الأكتاف والترايسبس",
            description: "ماكينة ضغط الأكتاف لبناء عضلات الكتف.",
            setup: "اضبط المقعد بحيث تكون المقابض قريبًا من مستوى الكتفين.",
            steps: [
                "اجلس وظهرك على المسند.",
                "أمسك المقابض.",
                "ادفع للأعلى.",
                "انزل ببطء إلى وضع البداية."
            ],
            mistakes: "لا تقوس أسفل الظهر ولا تستخدم وزنًا مبالغًا فيه.",
            safety: "ثبت ظهرك وحافظ على الكوعين تحت اليدين."
        },

        {
            id: 5,
            name: "Biceps Curl",
            category: "arms",
            categoryName: "ذراع",
            emoji: "💪",
            muscles: "البايسبس",
            description: "ماكينة مخصصة لعزل عضلة البايسبس.",
            setup: "اضبط المقعد حتى يكون الكوع في المكان الصحيح.",
            steps: [
                "ضع الذراعين على الوسادة.",
                "أمسك المقابض.",
                "ارفع المقابض باتجاه الكتفين.",
                "انزل ببطء."
            ],
            mistakes: "لا ترفع الكتفين ولا تستخدم حركة الجسم.",
            safety: "ركز على حركة الذراع فقط."
        },

        {
            id: 6,
            name: "Cable Machine",
            category: "arms",
            categoryName: "ذراع",
            emoji: "🔗",
            muscles: "عدة عضلات",
            description: "ماكينة الكابل متعددة الاستخدامات.",
            setup: "اختر المقبض والارتفاع المناسبين للتمرين.",
            steps: [
                "ثبت الوزن المناسب.",
                "أمسك المقبض.",
                "نفذ الحركة المطلوبة ببطء.",
                "ارجع إلى نقطة البداية."
            ],
            mistakes: "لا تستخدم وزنًا يجعل جسمك يتأرجح.",
            safety: "تأكد من تثبيت المقبض جيدًا."
        },

        {
            id: 7,
            name: "Treadmill",
            category: "cardio",
            categoryName: "كارديو",
            emoji: "🏃",
            muscles: "القلب والجزء السفلي",
            description: "جهاز المشي لتحسين اللياقة وحرق السعرات.",
            setup: "ابدأ بسرعة منخفضة قبل زيادة السرعة.",
            steps: [
                "قف على جانبي السير.",
                "ابدأ الجهاز بسرعة منخفضة.",
                "اصعد على السير.",
                "زد السرعة تدريجيًا حسب قدرتك."
            ],
            mistakes: "لا تبدأ بسرعة عالية مباشرة.",
            safety: "استخدم زر الإيقاف الطارئ عند الحاجة."
        },

        {
            id: 8,
            name: "Leg Extension",
            category: "legs",
            categoryName: "أرجل",
            emoji: "🦿",
            muscles: "عضلات الفخذ الأمامية",
            description: "تمرين عزل للفخذ الأمامي.",
            setup: "اضبط الوسادة لتكون فوق الكاحل مباشرة.",
            steps: [
                "اجلس وظهرك على المسند.",
                "ثبت الساقين خلف الوسادة.",
                "ارفع الساقين للأعلى.",
                "انزل ببطء."
            ],
            mistakes: "لا تستخدم وزنًا ثقيلًا جدًا.",
            safety: "تحكم بالحركة طوال الوقت."
        },

        {
            id: 9,
            name: "Seated Row",
            category: "back",
            categoryName: "ظهر",
            emoji: "🚣",
            muscles: "منتصف الظهر والبايسبس",
            description: "تمرين سحب أفقي لتقوية عضلات الظهر.",
            setup: "اضبط المقعد ومكان القدمين.",
            steps: [
                "اجلس مع ظهر مستقيم.",
                "أمسك المقبض.",
                "اسحب المقبض نحو البطن.",
                "ارجع ببطء."
            ],
            mistakes: "لا تحرك ظهرك للأمام والخلف بشكل مبالغ.",
            safety: "حافظ على العمود الفقري في وضع ثابت."
        },

        {
            id: 10,
            name: "Pec Deck",
            category: "chest",
            categoryName: "صدر",
            emoji: "🦅",
            muscles: "عضلات الصدر",
            description: "ماكينة عزل عضلات الصدر.",
            setup: "اضبط المقعد بحيث تكون المقابض بمستوى الصدر.",
            steps: [
                "اجلس وظهرك على المسند.",
                "أمسك المقابض.",
                "ضم الذراعين إلى الأمام.",
                "افتح الذراعين ببطء."
            ],
            mistakes: "لا تجعل الحركة سريعة.",
            safety: "حافظ على الكوعين بوضع مريح."
        }

    ];


    const exercises = [

        {
            id: 1,
            name: "Bench Press",
            muscle: "chest",
            muscleName: "صدر",
            emoji: "🏋️",
            level: "متوسط",
            sets: "4",
            reps: "8-12",
            description: "تمرين أساسي لبناء عضلات الصدر.",
            instructions: [
                "استلقِ على البنش.",
                "ثبت القدمين على الأرض.",
                "أمسك البار بقبضة مناسبة.",
                "أنزل البار باتجاه منتصف الصدر.",
                "ادفع البار للأعلى."
            ]
        },

        {
            id: 2,
            name: "Incline Dumbbell Press",
            muscle: "chest",
            muscleName: "صدر",
            emoji: "💪",
            level: "متوسط",
            sets: "3",
            reps: "8-12",
            description: "تمرين ممتاز للجزء العلوي من الصدر.",
            instructions: [
                "اضبط البنش بزاوية مائلة.",
                "ارفع الدمبلز فوق الصدر.",
                "انزل الدمبلز ببطء.",
                "ادفعهما للأعلى."
            ]
        },

        {
            id: 3,
            name: "Pull Up",
            muscle: "back",
            muscleName: "ظهر",
            emoji: "🦍",
            level: "متقدم",
            sets: "3",
            reps: "6-12",
            description: "تمرين قوي للظهر والبايسبس.",
            instructions: [
                "أمسك العقلة.",
                "ابدأ والذراعان ممدودتان.",
                "اسحب جسمك للأعلى.",
                "انزل ببطء."
            ]
        },

        {
            id: 4,
            name: "Barbell Row",
            muscle: "back",
            muscleName: "ظهر",
            emoji: "🏋️",
            level: "متوسط",
            sets: "4",
            reps: "8-10",
            description: "تمرين أساسي لبناء سماكة الظهر.",
            instructions: [
                "قف مع البار.",
                "انحنِ للأمام مع ظهر مستقيم.",
                "اسحب البار نحو البطن.",
                "انزله ببطء."
            ]
        },

        {
            id: 5,
            name: "Shoulder Press",
            muscle: "shoulders",
            muscleName: "أكتاف",
            emoji: "🔥",
            level: "متوسط",
            sets: "3",
            reps: "8-12",
            description: "تمرين ضغط لبناء الأكتاف.",
            instructions: [
                "اجلس على البنش.",
                "ارفع الدمبلز إلى مستوى الكتف.",
                "ادفعهما للأعلى.",
                "انزل ببطء."
            ]
        },

        {
            id: 6,
            name: "Lateral Raise",
            muscle: "shoulders",
            muscleName: "أكتاف",
            emoji: "🪽",
            level: "مبتدئ",
            sets: "3",
            reps: "12-15",
            description: "تمرين ممتاز للكتف الجانبي.",
            instructions: [
                "قف والدمبلز بجانب الجسم.",
                "ارفع الذراعين إلى الجانبين.",
                "توقف لحظة.",
                "انزل ببطء."
            ]
        },

        {
            id: 7,
            name: "Biceps Curl",
            muscle: "biceps",
            muscleName: "بايسبس",
            emoji: "💪",
            level: "مبتدئ",
            sets: "3",
            reps: "10-12",
            description: "تمرين أساسي لتقوية البايسبس.",
            instructions: [
                "قف بشكل مستقيم.",
                "ثبت الكوع بجانب الجسم.",
                "ارفع الدمبل باتجاه الكتف.",
                "انزل ببطء."
            ]
        },

        {
            id: 8,
            name: "Hammer Curl",
            muscle: "biceps",
            muscleName: "بايسبس",
            emoji: "🔨",
            level: "مبتدئ",
            sets: "3",
            reps: "10-12",
            description: "تمرين البايسبس بقبضة محايدة.",
            instructions: [
                "أمسك الدمبل بقبضة محايدة.",
                "ثبت الكوع.",
                "ارفع الدمبل.",
                "انزل ببطء."
            ]
        },

        {
            id: 9,
            name: "Triceps Pushdown",
            muscle: "triceps",
            muscleName: "ترايسبس",
            emoji: "💪",
            level: "مبتدئ",
            sets: "3",
            reps: "10-15",
            description: "تمرين عزل ممتاز للترايسبس.",
            instructions: [
                "قف أمام الكابل.",
                "أمسك المقبض.",
                "ثبت الكوع بجانب الجسم.",
                "ادفع المقبض للأسفل.",
                "ارجع ببطء."
            ]
        },

        {
            id: 10,
            name: "Squat",
            muscle: "legs",
            muscleName: "أرجل",
            emoji: "🦵",
            level: "متوسط",
            sets: "4",
            reps: "8-12",
            description: "من أهم تمارين الأرجل والجسم السفلي.",
            instructions: [
                "قف والقدمين بعرض الكتفين.",
                "انزل بالورك للخلف والأسفل.",
                "حافظ على الركبتين بوضع طبيعي.",
                "ادفع الأرض وارجع للوقوف."
            ]
        },

        {
            id: 11,
            name: "Leg Press",
            muscle: "legs",
            muscleName: "أرجل",
            emoji: "🦿",
            level: "مبتدئ",
            sets: "3",
            reps: "10-15",
            description: "تمرين ممتاز للفخذين والأرداف.",
            instructions: [
                "ضع القدمين على المنصة.",
                "حرر الأمان.",
                "انزل بالوزن.",
                "ادفع المنصة للأعلى."
            ]
        },

        {
            id: 12,
            name: "Crunch",
            muscle: "abs",
            muscleName: "بطن",
            emoji: "🎯",
            level: "مبتدئ",
            sets: "3",
            reps: "15-20",
            description: "تمرين بسيط لعضلات البطن.",
            instructions: [
                "استلقِ على ظهرك.",
                "اثنِ الركبتين.",
                "ارفع الجزء العلوي قليلًا.",
                "ارجع ببطء."
            ]
        }

    ];


    const programs = [

        {
            id: "fullbody",
            name: "Full Body",
            icon: "🏋️",
            level: "مبتدئ",
            days: "3 أيام",
            duration: "45 دقيقة",
            description: "برنامج كامل للجسم مناسب للمبتدئين.",
            exercises: [
                "Squat",
                "Bench Press",
                "Lat Pulldown",
                "Shoulder Press",
                "Biceps Curl",
                "Triceps Pushdown"
            ]
        },

        {
            id: "pushpulllegs",
            name: "Push / Pull / Legs",
            icon: "🔥",
            level: "متوسط",
            days: "6 أيام",
            duration: "60 دقيقة",
            description: "برنامج متقدم مقسم إلى دفع وسحب وأرجل.",
            exercises: [
                "Bench Press",
                "Shoulder Press",
                "Triceps Pushdown",
                "Pull Up",
                "Barbell Row",
                "Biceps Curl",
                "Squat",
                "Leg Press"
            ]
        },

        {
            id: "upperlower",
            name: "Upper / Lower",
            icon: "💪",
            level: "متوسط",
            days: "4 أيام",
            duration: "55 دقيقة",
            description: "تقسيم ممتاز لتدريب الجزء العلوي والسفلي.",
            exercises: [
                "Bench Press",
                "Barbell Row",
                "Shoulder Press",
                "Biceps Curl",
                "Squat",
                "Leg Press",
                "Crunch"
            ]
        },

        {
            id: "beginner",
            name: "Beginner",
            icon: "🌱",
            level: "مبتدئ",
            days: "3 أيام",
            duration: "40 دقيقة",
            description: "خطة بسيطة لتبدأ رحلتك في الجيم.",
            exercises: [
                "Squat",
                "Bench Press",
                "Lat Pulldown",
                "Shoulder Press",
                "Biceps Curl"
            ]
        },

        {
            id: "strength",
            name: "Strength",
            icon: "🏆",
            level: "متقدم",
            days: "4 أيام",
            duration: "70 دقيقة",
            description: "برنامج يركز على القوة ورفع الأوزان.",
            exercises: [
                "Squat",
                "Bench Press",
                "Barbell Row",
                "Shoulder Press"
            ]
        },

        {
            id: "fitness",
            name: "Fitness",
            icon: "❤️",
            level: "مبتدئ",
            days: "4 أيام",
            duration: "45 دقيقة",
            description: "برنامج لتحسين اللياقة والحركة العامة.",
            exercises: [
                "Squat",
                "Crunch",
                "Lateral Raise",
                "Leg Press"
            ]
        }

    ];


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const pages = document.querySelectorAll(".page");

    const navItems = document.querySelectorAll("[data-page]");

    const sidebar = document.getElementById("sidebar");

    const menuButton = document.getElementById("menuButton");

    const overlay = document.getElementById("overlay");

    const modal = document.getElementById("modal");

    const modalContent = document.getElementById("modalContent");

    const machineContainer =
        document.getElementById("machinesContainer");

    const exerciseContainer =
        document.getElementById("exercisesContainer");

    const programsContainer =
        document.getElementById("programsContainer");

    const machineSearch =
        document.getElementById("machineSearch");

    const machineFilter =
        document.getElementById("machineFilter");

    const recentList =
        document.getElementById("recentList");

    const historyList =
        document.getElementById("historyList");


    /* =====================================================
       STORAGE
    ===================================================== */

    let history = [];

    try {

        const { data, error } =
            await supabaseClient
                .from("workout_history")
                .select("*")
                .eq("user_id", currentUser.id)
                .order("created_at", { ascending: false })
                .limit(100);

        if (!error && data) {

            history = data.map(function (row) {
                return {
                    id: row.id,
                    exercise: row.exercise,
                    weight: row.weight,
                    sets: row.sets,
                    reps: row.reps,
                    minutes: row.minutes,
                    date: row.workout_date
                };
            });
        }

        if (!Array.isArray(history)) {
            history = [];
        }

    } catch (error) {
        history = [];
    }


    async function saveHistory() {

        try {

            await supabaseClient
                .from("workout_history")
                .delete()
                .eq("user_id", currentUser.id);

            if (history.length > 0) {

                const rows =
                    history.map(function (workout) {
                        return {
                            user_id: currentUser.id,
                            exercise: workout.exercise,
                            weight: workout.weight,
                            sets: workout.sets,
                            reps: workout.reps,
                            minutes: workout.minutes,
                            workout_date: workout.date
                        };
                    });

                await supabaseClient
                    .from("workout_history")
                    .insert(rows);
            }

        } catch (error) {
            console.log("Storage error");
        }

    }


    /* =====================================================
       PAGE NAVIGATION
    ===================================================== */

    function openPage(pageName) {

        pages.forEach(function (page) {
            page.classList.remove("active");
        });


        const target =
            document.getElementById(pageName);

        if (target) {
            target.classList.add("active");
        }


        document
            .querySelectorAll(".nav-item[data-page]")
            .forEach(function (item) {

                item.classList.remove("active");

                if (
                    item.getAttribute("data-page")
                    === pageName
                ) {
                    item.classList.add("active");
                }

            });


        closeMobileMenu();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    /* =====================================================
       NAVIGATION EVENTS
    ===================================================== */

    navItems.forEach(function (item) {

        item.addEventListener("click", function () {

            const page =
                item.getAttribute("data-page");

            if (page) {
                openPage(page);
            }

        });

    });


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    function openMobileMenu() {

        if (sidebar) {
            sidebar.classList.add("open");
        }

        if (overlay) {
            overlay.classList.add("show");
        }

    }


    function closeMobileMenu() {

        if (sidebar) {
            sidebar.classList.remove("open");
        }

        if (overlay) {
            overlay.classList.remove("show");
        }

    }


    if (menuButton) {

        menuButton.addEventListener(
            "click",
            function () {

                if (
                    sidebar.classList.contains("open")
                ) {
                    closeMobileMenu();
                } else {
                    openMobileMenu();
                }

            }
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeMobileMenu
        );

    }


    /* =====================================================
       MACHINES RENDER
    ===================================================== */

    function renderMachines() {

        if (!machineContainer) {
            return;
        }


        const search =
            machineSearch
                ? machineSearch.value
                    .trim()
                    .toLowerCase()
                : "";


        const category =
            machineFilter
                ? machineFilter.value
                : "all";


        const filtered =
            machines.filter(function (machine) {

                const matchesSearch =
                    machine.name
                        .toLowerCase()
                        .includes(search)
                    ||
                    machine.muscles
                        .toLowerCase()
                        .includes(search);


                const matchesCategory =
                    category === "all"
                    ||
                    machine.category === category;


                return (
                    matchesSearch
                    &&
                    matchesCategory
                );

            });


        if (filtered.length === 0) {

            machineContainer.innerHTML = `
                <div class="empty">
                    <div class="empty-icon">🔎</div>
                    <h4>لم نجد الماكينة</h4>
                    <p>جرب البحث باسم مختلف.</p>
                </div>
            `;

            return;
        }


        machineContainer.innerHTML =
            filtered.map(function (machine) {

                return `
                    <article class="card">

                        <div class="card-image">

                            <span>
                                ${machine.emoji}
                            </span>

                            <div class="card-category">
                                ${machine.categoryName}
                            </div>

                        </div>


                        <div class="card-body">

                            <h3>
                                ${machine.name}
                            </h3>

                            <p>
                                ${machine.description}
                            </p>

                            <div class="card-info">

                                <span class="tag">
                                    💪 ${machine.muscles}
                                </span>

                            </div>

                            <button
                                class="card-btn"
                                data-machine="${machine.id}"
                            >
                                شرح الاستخدام
                            </button>

                        </div>

                    </article>
                `;

            }).join("");

    }


    if (machineSearch) {

        machineSearch.addEventListener(
            "input",
            renderMachines
        );

    }


    if (machineFilter) {

        machineFilter.addEventListener(
            "change",
            renderMachines
        );

    }


    /* =====================================================
       MACHINE MODAL
    ===================================================== */

    function showMachine(machineId) {

        const machine =
            machines.find(function (item) {

                return item.id === Number(machineId);

            });


        if (!machine) {
            return;
        }


        modalContent.innerHTML = `

            <div class="modal-header">

                <div class="modal-emoji">
                    ${machine.emoji}
                </div>

                <div>

                    <h2>
                        ${machine.name}
                    </h2>

                    <p>
                        ${machine.categoryName}
                        •
                        ${machine.muscles}
                    </p>

                </div>

            </div>


            <div class="modal-section">

                <h3>🎯 العضلات المستهدفة</h3>

                <p>
                    ${machine.muscles}
                </p>

            </div>


            <div class="modal-section">

                <h3>⚙️ طريقة ضبط الماكينة</h3>

                <p>
                    ${machine.setup}
                </p>

            </div>


            <div class="modal-section">

                <h3>📋 طريقة الاستخدام</h3>

                <div class="steps">

                    ${machine.steps.map(
                        function (step, index) {

                            return `
                                <div class="step">

                                    <div class="step-number">
                                        ${index + 1}
                                    </div>

                                    <p>
                                        ${step}
                                    </p>

                                </div>
                            `;

                        }
                    ).join("")}

                </div>

            </div>


            <div class="modal-section">

                <h3>⚠️ أخطاء شائعة</h3>

                <p>
                    ${machine.mistakes}
                </p>

            </div>


            <div class="modal-section">

                <h3>🛡️ نصائح السلامة</h3>

                <p>
                    ${machine.safety}
                </p>

            </div>

        `;


        openModal();

    }


    /* =====================================================
       EXERCISES RENDER
    ===================================================== */

    let currentMuscle = "all";


    function renderExercises() {

        if (!exerciseContainer) {
            return;
        }


        const filtered =
            currentMuscle === "all"
                ? exercises
                : exercises.filter(function (exercise) {

                    return (
                        exercise.muscle
                        === currentMuscle
                    );

                });


        exerciseContainer.innerHTML =
            filtered.map(function (exercise) {

                return `

                    <article class="card">

                        <div class="card-image">

                            ${exercise.emoji}

                            <div class="card-category">
                                ${exercise.muscleName}
                            </div>

                        </div>


                        <div class="card-body">

                            <h3>
                                ${exercise.name}
                            </h3>

                            <p>
                                ${exercise.description}
                            </p>


                            <div class="card-info">

                                <span class="tag">
                                    ${exercise.level}
                                </span>

                                <span class="tag">
                                    ${exercise.sets} Sets
                                </span>

                                <span class="tag">
                                    ${exercise.reps} Reps
                                </span>

                            </div>


                            <button
                                class="card-btn"
                                data-exercise="${exercise.id}"
                            >
                                شرح التمرين
                            </button>

                        </div>

                    </article>

                `;

            }).join("");

    }


    /* =====================================================
       MUSCLE FILTERS
    ===================================================== */

    document
        .querySelectorAll("[data-muscle]")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    currentMuscle =
                        button.getAttribute(
                            "data-muscle"
                        );


                    document
                        .querySelectorAll(".filter")
                        .forEach(function (filter) {

                            filter.classList.remove(
                                "active"
                            );

                        });


                    button.classList.add("active");

                    renderExercises();

                }
            );

        });


    /* =====================================================
       EXERCISE MODAL
    ===================================================== */

    function showExercise(exerciseId) {

        const exercise =
            exercises.find(function (item) {

                return item.id === Number(exerciseId);

            });


        if (!exercise) {
            return;
        }


        modalContent.innerHTML = `

            <div class="modal-header">

                <div class="modal-emoji">
                    ${exercise.emoji}
                </div>

                <div>

                    <h2>
                        ${exercise.name}
                    </h2>

                    <p>
                        ${exercise.muscleName}
                        •
                        ${exercise.level}
                    </p>

                </div>

            </div>


            <div class="modal-section">

                <h3>💪 عن التمرين</h3>

                <p>
                    ${exercise.description}
                </p>

            </div>


            <div class="modal-section">

                <h3>🎯 البرنامج المقترح</h3>

                <p>
                    ${exercise.sets}
                    مجموعات ×
                    ${exercise.reps}
                    تكرار
                </p>

            </div>


            <div class="modal-section">

                <h3>📋 طريقة أداء التمرين</h3>

                <div class="steps">

                    ${exercise.instructions.map(
                        function (step, index) {

                            return `
                                <div class="step">

                                    <div class="step-number">
                                        ${index + 1}
                                    </div>

                                    <p>
                                        ${step}
                                    </p>

                                </div>
                            `;

                        }
                    ).join("")}

                </div>

            </div>


            <div class="modal-section">

                <h3>⏱️ تسجيل التمرين</h3>

                <form
                    class="workout-form"
                    id="workoutForm"
                >

                    <label>
                        الوزن بالكيلو

                        <input
                            type="number"
                            id="workoutWeight"
                            min="0"
                            step="0.5"
                            placeholder="مثلاً 40"
                            required
                        >
                    </label>


                    <label>
                        عدد المجموعات

                        <input
                            type="number"
                            id="workoutSets"
                            min="1"
                            value="${exercise.sets}"
                            required
                        >
                    </label>


                    <label>
                        عدد التكرارات

                        <input
                            type="number"
                            id="workoutReps"
                            min="1"
                            value="${exercise.reps.split("-")[0]}"
                            required
                        >
                    </label>


                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        ✅ حفظ التمرين
                    </button>

                </form>

            </div>

        `;


        openModal();

    }


    /* =====================================================
       PROGRAMS RENDER
    ===================================================== */

    function renderPrograms() {

        if (!programsContainer) {
            return;
        }


        programsContainer.innerHTML =
            programs.map(function (program) {

                return `

                    <article class="program">

                        <div class="program-icon">
                            ${program.icon}
                        </div>

                        <h3>
                            ${program.name}
                        </h3>

                        <p>
                            ${program.description}
                        </p>


                        <div class="program-meta">

                            <span>
                                📅 ${program.days}
                            </span>

                            <span>
                                ⏱️ ${program.duration}
                            </span>

                            <span>
                                ${program.level}
                            </span>

                        </div>


                        <button
                            class="primary-btn"
                            data-program="${program.id}"
                        >
                            عرض البرنامج
                        </button>

                    </article>

                `;

            }).join("");

    }


    /* =====================================================
       PROGRAM MODAL
    ===================================================== */

    function showProgram(programId) {

        const program =
            programs.find(function (item) {

                return item.id === programId;

            });


        if (!program) {
            return;
        }


        modalContent.innerHTML = `

            <div class="modal-header">

                <div class="modal-emoji">
                    ${program.icon}
                </div>

                <div>

                    <h2>
                        ${program.name}
                    </h2>

                    <p>
                        ${program.level}
                        •
                        ${program.days}
                    </p>

                </div>

            </div>


            <div class="modal-section">

                <h3>📋 وصف البرنامج</h3>

                <p>
                    ${program.description}
                </p>

            </div>


            <div class="modal-section">

                <h3>📅 معلومات البرنامج</h3>

                <p>
                    ${program.days}
                    •
                    ${program.duration}
                    •
                    المستوى:
                    ${program.level}
                </p>

            </div>


            <div class="modal-section">

                <h3>🏋️ التمارين</h3>

                <div class="steps">

                    ${program.exercises.map(
                        function (exerciseName, index) {

                            return `
                                <div class="step">

                                    <div class="step-number">
                                        ${index + 1}
                                    </div>

                                    <p>
                                        ${exerciseName}
                                    </p>

                                </div>
                            `;

                        }
                    ).join("")}

                </div>

            </div>


            <button
                class="primary-btn"
                id="startProgramButton"
            >
                🔥 ابدأ البرنامج
            </button>

        `;


        openModal();


        const startButton =
            document.getElementById(
                "startProgramButton"
            );


        if (startButton) {

            startButton.addEventListener(
                "click",
                function () {

                    closeModal();

                    showToast(
                        "تم بدء برنامج " +
                        program.name
                    );

                    startRestTimer();

                }
            );

        }

    }


    /* =====================================================
       MODAL FUNCTIONS
    ===================================================== */

    function openModal() {

        if (!modal) {
            return;
        }

        modal.classList.add("show");

        document.body.style.overflow =
            "hidden";

    }


    function closeModal() {

        if (!modal) {
            return;
        }

        modal.classList.remove("show");

        document.body.style.overflow =
            "";

    }


    document.addEventListener(
        "click",
        function (event) {

            const closeButton =
                event.target.closest(
                    "[data-close]"
                );

            if (closeButton) {
                closeModal();
            }

        }
    );


    /* =====================================================
       GLOBAL CLICK HANDLER
       ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const machineButton =
                event.target.closest(
                    "[data-machine]"
                );

            if (machineButton) {

                showMachine(
                    machineButton.getAttribute(
                        "data-machine"
                    )
                );

                return;
            }


            const exerciseButton =
                event.target.closest(
                    "[data-exercise]"
                );

            if (exerciseButton) {

                showExercise(
                    exerciseButton.getAttribute(
                        "data-exercise"
                    )
                );

                return;
            }


            const programButton =
                event.target.closest(
                    "[data-program]"
                );

            if (programButton) {

                showProgram(
                    programButton.getAttribute(
                        "data-program"
                    )
                );

                return;
            }


            const pageButton =
                event.target.closest(
                    "[data-page]"
                );

            if (
                pageButton
                &&
                !pageButton.classList.contains(
                    "nav-item"
                )
            ) {

                const page =
                    pageButton.getAttribute(
                        "data-page"
                    );

                if (page) {
                    openPage(page);
                }

            }

        }
    );


    /* =====================================================
       WORKOUT FORM
    ===================================================== */

    document.addEventListener(
        "submit",
        function (event) {

            if (
                event.target.id
                !== "workoutForm"
            ) {
                return;
            }


            event.preventDefault();


            const weight =
                Number(
                    document.getElementById(
                        "workoutWeight"
                    ).value
                );


            const sets =
                Number(
                    document.getElementById(
                        "workoutSets"
                    ).value
                );


            const reps =
                Number(
                    document.getElementById(
                        "workoutReps"
                    ).value
                );


            const activeExercise =
                modalContent.querySelector(
                    ".modal-header h2"
                );


            const exerciseName =
                activeExercise
                    ? activeExercise.textContent.trim()
                    : "تمرين";


            const workout = {

                id: Date.now(),

                exercise: exerciseName,

                weight: weight,

                sets: sets,

                reps: reps,

                minutes: 10,

                date:
                    new Date().toLocaleString(
                        "ar-JO"
                    )

            };


            history.unshift(workout);


            if (history.length > 100) {
                history =
                    history.slice(0, 100);
            }


            saveHistory();

            updateStats();

            renderHistory();

            renderRecent();

            closeModal();


            showToast(
                "تم حفظ التمرين بنجاح 💪"
            );

        }
    );


    /* =====================================================
       HISTORY
    ===================================================== */

    function renderHistory() {

        if (!historyList) {
            return;
        }


        if (history.length === 0) {

            historyList.innerHTML = `

                <div class="empty">

                    <div class="empty-icon">
                        📊
                    </div>

                    <h4>
                        لا يوجد سجل حتى الآن
                    </h4>

                    <p>
                        عندما تسجل أول تمرين سيظهر هنا.
                    </p>

                </div>

            `;

            return;
        }


        historyList.innerHTML =
            history.map(function (item) {

                return `

                    <div class="history-item">

                        <div class="history-icon">
                            💪
                        </div>

                        <div class="history-info">

                            <strong>
                                ${item.exercise}
                            </strong>

                            <small>
                                ${item.date}
                                •
                                ${item.weight} كغ
                                •
                                ${item.sets} مجموعات
                                ×
                                ${item.reps}
                            </small>

                        </div>

                        <div class="history-time">
                            ${item.minutes} دقيقة
                        </div>

                    </div>

                `;

            }).join("");

    }


    /* =====================================================
       RECENT WORKOUTS
    ===================================================== */

    function renderRecent() {

        if (!recentList) {
            return;
        }


        if (history.length === 0) {

            recentList.innerHTML = `

                <div class="empty">

                    <div class="empty-icon">
                        🏋️
                    </div>

                    <h4>
                        لا توجد تمارين بعد
                    </h4>

                    <p>
                        ابدأ أول تمرين لك وسيظهر هنا.
                    </p>

                    <button
                        class="primary-btn"
                        data-page="exercises"
                    >
                        ابدأ الآن
                    </button>

                </div>

            `;

            return;
        }


        recentList.innerHTML =
            history
                .slice(0, 5)
                .map(function (item) {

                    return `

                        <div class="history-item">

                            <div class="history-icon">
                                💪
                            </div>

                            <div class="history-info">

                                <strong>
                                    ${item.exercise}
                                </strong>

                                <small>
                                    ${item.date}
                                    •
                                    ${item.weight} كغ
                                </small>

                            </div>

                            <div class="history-time">
                                ✓
                            </div>

                        </div>

                    `;

                })
                .join("");

    }


    /* =====================================================
       STATS
    ===================================================== */

    function updateStats() {

        const total =
            history.length;


        const totalMinutes =
            history.reduce(
                function (sum, item) {

                    return (
                        sum
                        +
                        Number(item.minutes || 0)
                    );

                },
                0
            );


        const prs =
            history.filter(
                function (item) {

                    return Number(
                        item.weight || 0
                    ) >= 100;

                }
            ).length;


        const weekAgo =
            Date.now()
            -
            (
                7
                *
                24
                *
                60
                *
                60
                *
                1000
            );


        const week =
            history.filter(
                function (item) {

                    return (
                        Number(item.id)
                        >=
                        weekAgo
                    );

                }
            ).length;


        const weekElement =
            document.getElementById(
                "weekCount"
            );

        const totalElement =
            document.getElementById(
                "totalCount"
            );

        const prElement =
            document.getElementById(
                "prCount"
            );

        const timeElement =
            document.getElementById(
                "timeCount"
            );


        if (weekElement) {
            weekElement.textContent =
                week;
        }

        if (totalElement) {
            totalElement.textContent =
                total;
        }

        if (prElement) {
            prElement.textContent =
                prs;
        }

        if (timeElement) {
            timeElement.textContent =
                totalMinutes +
                " دقيقة";
        }


        const progressCount =
            document.getElementById(
                "progressCount"
            );

        const progressMinutes =
            document.getElementById(
                "progressMinutes"
            );

        const progressPR =
            document.getElementById(
                "progressPR"
            );


        if (progressCount) {
            progressCount.textContent =
                total;
        }

        if (progressMinutes) {
            progressMinutes.textContent =
                totalMinutes +
                " دقيقة";
        }

        if (progressPR) {
            progressPR.textContent =
                prs;
        }

    }


    /* =====================================================
       CLEAR HISTORY
    ===================================================== */

    const clearHistory =
        document.getElementById(
            "clearHistory"
        );


    if (clearHistory) {

        clearHistory.addEventListener(
            "click",
            function () {

                if (history.length === 0) {

                    showToast(
                        "السجل فارغ"
                    );

                    return;
                }


                const confirmed =
                    confirm(
                        "هل تريد مسح جميع التمارين؟"
                    );


                if (!confirmed) {
                    return;
                }


                history = [];

                saveHistory();

                updateStats();

                renderHistory();

                renderRecent();

                showToast(
                    "تم مسح السجل"
                );

            }
        );

    }


    /* =====================================================
       REST TIMER
    ===================================================== */

    let timerInterval = null;

    let timerSeconds = 60;


    function startRestTimer() {

        clearInterval(timerInterval);

        timerSeconds = 60;


        modalContent.innerHTML = `

            <div class="modal-header">

                <div class="modal-emoji">
                    ⏱️
                </div>

                <div>

                    <h2>
                        مؤقت الراحة
                    </h2>

                    <p>
                        خذ وقتك واستعد للمجموعة القادمة.
                    </p>

                </div>

            </div>


            <div class="timer">

                <strong id="timerDisplay">
                    01:00
                </strong>

                <div class="timer-buttons">

                    <button id="timerStart">
                        ▶️ ابدأ
                    </button>

                    <button id="timerReset">
                        🔄 إعادة
                    </button>

                    <button id="timerAdd">
                        +30 ثانية
                    </button>

                </div>

            </div>

        `;


        openModal();


        const display =
            document.getElementById(
                "timerDisplay"
            );


        const startButton =
            document.getElementById(
                "timerStart"
            );


        const resetButton =
            document.getElementById(
                "timerReset"
            );


        const addButton =
            document.getElementById(
                "timerAdd"
            );


        function updateTimer() {

            const minutes =
                Math.floor(
                    timerSeconds / 60
                );


            const seconds =
                timerSeconds % 60;


            display.textContent =
                String(minutes).padStart(2, "0")
                +
                ":"
                +
                String(seconds).padStart(2, "0");

        }


        startButton.addEventListener(
            "click",
            function () {

                if (timerInterval) {
                    return;
                }


                timerInterval =
                    setInterval(
                        function () {

                            timerSeconds--;

                            updateTimer();


                            if (
                                timerSeconds <= 0
                            ) {

                                clearInterval(
                                    timerInterval
                                );

                                timerInterval =
                                    null;

                                showToast(
                                    "انتهى وقت الراحة 🔥"
                                );

                            }

                        },
                        1000
                    );

            }
        );


        resetButton.addEventListener(
            "click",
            function () {

                clearInterval(
                    timerInterval
                );

                timerInterval =
                    null;

                timerSeconds = 60;

                updateTimer();

            }
        );


        addButton.addEventListener(
            "click",
            function () {

                timerSeconds += 30;

                updateTimer();

            }
        );


        updateTimer();

    }


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                closeModal();

                closeMobileMenu();

            }

        }
    );


    /* =====================================================
       DARK MODE
    ===================================================== */

    const darkToggle =
        document.getElementById(
            "darkToggle"
        );


    if (darkToggle) {

        let darkMode = true;


        try {

            const savedTheme =
                localStorage.getItem(
                    "gymProTheme"
                );

            if (
                savedTheme === "light"
            ) {

                darkMode = false;

                document.body.classList.add(
                    "light-mode"
                );

                darkToggle.checked =
                    false;

            }

        } catch (error) {
            // ignore
        }


        darkToggle.addEventListener(
            "change",
            function () {

                darkMode =
                    darkToggle.checked;


                if (darkMode) {

                    document.body.classList.remove(
                        "light-mode"
                    );

                } else {

                    document.body.classList.add(
                        "light-mode"
                    );

                }


                try {

                    localStorage.setItem(
                        "gymProTheme",
                        darkMode
                            ? "dark"
                            : "light"
                    );

                } catch (error) {
                    // ignore
                }

            }
        );

    }


    /* =====================================================
       NOTIFICATIONS
    ===================================================== */

    const notificationToggle =
        document.getElementById(
            "notificationToggle"
        );


    if (notificationToggle) {

        notificationToggle.addEventListener(
            "change",
            function () {

                if (
                    notificationToggle.checked
                ) {

                    showToast(
                        "تم تفعيل الإشعارات 🔔"
                    );

                } else {

                    showToast(
                        "تم إيقاف الإشعارات"
                    );

                }

            }
        );

    }


    /* =====================================================
       TOAST
    ===================================================== */

    let toastTimeout = null;


    function showToast(message) {

        const toast =
            document.getElementById(
                "toast"
            );


        const toastText =
            document.getElementById(
                "toastText"
            );


        if (
            !toast
            ||
            !toastText
        ) {
            return;
        }


        toastText.textContent =
            message;


        toast.classList.add("show");


        clearTimeout(
            toastTimeout
        );


        toastTimeout =
            setTimeout(
                function () {

                    toast.classList.remove(
                        "show"
                    );

                },
                2500
            );

    }


    /* =====================================================
       INITIALIZE APP
    ===================================================== */

    renderMachines();

    renderExercises();

    renderPrograms();

    renderHistory();

    renderRecent();

    updateStats();


    /* =====================================================
       APP READY
    ===================================================== */

    console.log(
        "GYM PRO loaded successfully ✅"
    );
/* =====================================================
   USER PROFILE (مرتبط بـ Supabase)
===================================================== */

const profileName = document.getElementById("profileName");
const profileAge = document.getElementById("profileAge");
const profileHeight = document.getElementById("profileHeight");
const profileWeight = document.getElementById("profileWeight");
const saveProfile = document.getElementById("saveProfile");

const userAvatar = document.getElementById("userAvatar");
const userNameEl = document.getElementById("userName");
const userEmailEl = document.getElementById("userEmail");

let selectedGoal = "fitness";


function updateUserDisplay(displayName) {

    const name =
        displayName && displayName.trim()
            ? displayName.trim()
            : (currentUser.email || "عضو الجيم");

    if (userNameEl) {
        userNameEl.textContent = name;
    }

    if (userEmailEl) {
        userEmailEl.textContent = currentUser.email || "";
    }

    if (userAvatar) {
        userAvatar.textContent =
            name.trim().charAt(0).toUpperCase() || "M";
    }

}


async function loadProfile() {

    try {

        const { data, error } =
            await supabaseClient
                .from("profiles")
                .select("*")
                .eq("id", currentUser.id)
                .maybeSingle();

        if (error || !data) {
            updateUserDisplay();
            return;
        }

        if (profileName) {
            profileName.value = data.name || "";
        }

        if (profileAge) {
            profileAge.value = data.age || "";
        }

        if (profileHeight) {
            profileHeight.value = data.height || "";
        }

        if (profileWeight) {
            profileWeight.value = data.weight || "";
        }

        if (data.goal) {
            selectedGoal = data.goal;
        }

        updateGoalButtons();
        updateUserDisplay(data.name);

    } catch (error) {

        console.log(
            "تعذر تحميل بيانات الملف"
        );

        updateUserDisplay();
    }
}

function updateGoalButtons() {

    document
        .querySelectorAll("[data-goal]")
        .forEach(function (button) {

            button.classList.toggle(
                "active",
                button.getAttribute("data-goal")
                === selectedGoal
            );

        });
}

document
    .querySelectorAll("[data-goal]")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                selectedGoal =
                    button.getAttribute(
                        "data-goal"
                    );

                updateGoalButtons();

            }
        );

    });

if (saveProfile) {

    saveProfile.addEventListener(
        "click",
        async function () {

            const profile = {
                name:
                    profileName
                        ? profileName.value.trim()
                        : "",

                age:
                    profileAge && profileAge.value
                        ? Number(profileAge.value)
                        : null,

                height:
                    profileHeight && profileHeight.value
                        ? Number(profileHeight.value)
                        : null,

                weight:
                    profileWeight && profileWeight.value
                        ? Number(profileWeight.value)
                        : null,

                goal: selectedGoal
            };

            try {

                const { error } =
                    await supabaseClient
                        .from("profiles")
                        .upsert({
                            id: currentUser.id,
                            name: profile.name,
                            age: profile.age,
                            height: profile.height,
                            weight: profile.weight,
                            goal: profile.goal,
                            updated_at: new Date().toISOString()
                        });

                if (error) {
                    throw error;
                }

                showToast(
                    "تم حفظ بياناتك بنجاح 💪"
                );

                updateUserDisplay(profile.name);

            } catch (error) {

                showToast(
                    "حدث خطأ أثناء حفظ البيانات"
                );

            }

        }
    );

}

updateUserDisplay();
await loadProfile();

    }
    /* end startApp */

});
