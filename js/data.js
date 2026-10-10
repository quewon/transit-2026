var current_location;
var current_job;
var money = 0;
var tickets = {};

if (localStorage.getItem("current_job"))
    current_job = JSON.parse(localStorage.getItem("current_job"));
if (localStorage.getItem("money"))
    money = parseInt(localStorage.getItem("money"));
if (localStorage.getItem("tickets"))
    tickets = JSON.parse(localStorage.getItem("tickets"));

const MESSAGE = {
    parts: [
        "nxobjxoe ixoehx c-dhoxggh-d ccxox boxb-b",
        "s- tg-wz-v sgptu-vzptupg.",
        "l-ozipzzim l- mz-ps-m yizx-zps-o r-zipzzi nz-osiz m-zqlz-",
        "fbsb ks-fmbklb isbin-smb lbsfrmbs",
        "gbskb fbsh-h rbsslrbsb gs-hlbs",
        "xd-vmtv-sdmm smdm vd-qw-s xmduw-tddm",
        "i-mfwj qw-m. pfwliwffoopwf. jfwlpf nfwlip-mwwfj pfwwfifvfwqfw.",
        "n-qbkrbbko okbo-o",
        "t- uh-xaq ttqhqahquqhxhhqu uqhqtqh ahqyza-w thqw aqhwaqh",
        "z-frs-s rfoxyo t-fuffoy-fszo",
        "fooxbnxoix hxobnb-b aoxghx c-odooxh-obix",
        "k-wlwwfp-wmpwff oofwvpfj vfwjo-wmp-l o-wfiw-",
        "n- ob-r zbbkoakbnbkk, okbksp-bopkb."
    ],
    index: 0
}

if (localStorage.getItem("message_index"))
    MESSAGE.index = parseInt(localStorage.getItem("message_index"));

const RANDOS = [
    {
        image: "babyholder.png",
        title: "person holding a baby",
        say: "waa!! waaaa!!"
    },
    {
        image: "beggar.png",
        title: "beggar",
        say: "..."
    },
    {
        image: "cellist.png",
        title: "cellist",
        say: "hm"
    },
    {
        image: "earbuds.png",
        title: "music enjoyer",
        say: "(bobs head)"
    },
    {
        image: "fatherandchild.png",
        title: "father and child",
        say: "dad, are we there yet??"
    },
    {
        image: "officeworker.png",
        title: "office worker",
        say: "ha..."
    },
    {
        image: "sleeper.png",
        title: "sleeping stranger",
        say: "zzzzzzz"
    },
    {
        image: "talker.png",
        title: "talking on the phone",
        say: "(loud and incoherent conversation)"
    },
    {
        image: "tourist.png",
        title: "tourist",
        say: "so that's... and we're... and there's..."
    }
]