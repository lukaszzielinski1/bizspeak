const { createApp, reactive } = Vue
import { initializeApp} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js"
import { collection, getDocs, getDoc, setDoc, doc, query, where, updateDoc, deleteDoc} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js'
import { getAuth, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js'

const firebaseConfig = {
    apiKey: "AIzaSyA7a2WtrH8TFr-FcGN-VbJGDX3h5LKMPLg",
    authDomain: "licencjat-e399e.firebaseapp.com",
    projectId: "licencjat-e399e",
    storageBucket: "licencjat-e399e.appspot.com",
    messagingSenderId: "989239349932",
    appId: "1:989239349932:web:12b42432f0035a99270509"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


const appInstance = createApp({
    data() {
        return {
            uname_: '',
            mail_: '',
            pass_: '',
            message: '',
            phrases: [],
            currentPhrase: {},
            options: [],
            currentPhraseIndex: 0,
            totalPhrases: 0,
            score: 0,
            gameOver: false,
            gameStarted: false,
            gameStartGame: true,
            highScore: 0,
            user: null
        };
    },
    methods: {
        async toLogIn() {
            location.replace("/signin.html");
        },
        async toSignUp() {
            location.replace("/signup.html");
        },
        async toEng() {
            location.replace("/engtopol.html");
        },
        async toMenu() {
            location.replace("/menu.html");
        },
        async logOut() {
            signOut(auth).then(() => {
                location.replace("/index.html");
                console.log("User successfully logged out");
            }).catch((error) => {
                alert("An error occurred:\n" + error);
            });
        },
        async toModes() {
            location.replace("/modes.html");
        },
        async logIn() {
            this.mail_ = this.$refs.mail.value;
            this.pass_ = this.$refs.pass.value;
            signInWithEmailAndPassword(auth, this.mail_, this.pass_)
        .then(async (userCredential) => {
            const user = userCredential.user;
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                this.uname_ = userDoc.data().username;
                location.replace("/menu.html");
            } else {
                console.log("User document not found");
            }
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    alert("An error occurred: " + errorCode + "\n" + errorMessage);
                });
            },
        async signUp() {
            this.uname_ = this.$refs.uname.value;
            this.mail_ = this.$refs.mail.value;
            this.pass_ = this.$refs.pass.value;

            if (this.uname_ && this.mail_ && this.pass_) {
                await createUserWithEmailAndPassword(auth, this.mail_, this.pass_)
                    .then(async (userCredential) => {
                        await setDoc(doc(db, "users", userCredential.user.uid), {
                            username: this.uname_,
                            email: this.mail_,
                            highScore: 0 // Initialize high score to 0
                        }).then(() => {
                            console.log("User has successfully signed up");
                        });
                        location.replace("/menu.html");
                    })
                    .catch((error) => {
                        const errorCode = error.code;
                        const errorMessage = error.message;
                        alert("An error occurred: " + errorCode + "\n" + errorMessage);
                    });
            }
        },
        async fetchPhrases() {
            const phrasesSnapshot = await getDocs(collection(db, 'phrases_data'));
            this.phrases = phrasesSnapshot.docs.map(doc => doc.data());
            this.totalPhrases = this.phrases.length; // Ustawienie całkowitej liczby fraz
            
        },
        startGame() {
            this.score = 0;
            this.gameOver = false;
            this.gameStarted = true;
            this.gameStartGame = false;
            this.nextPhrase();
        },
        nextPhrase() {
            console.log('Getting next phrase...');
            if (this.phrases.length === 0) {
                console.log('No more phrases available. Ending game.');
                this.endGame();
                return;
            }
            
            const randomIndex = Math.floor(Math.random() * this.phrases.length);
            this.currentPhrase = this.phrases.splice(randomIndex, 1)[0];
            this.currentPhraseIndex++;
            
            console.log(`Current phrase index: ${this.currentPhraseIndex}`);
            console.log('Current phrase:', this.currentPhrase);
            
            this.generateOptions();
        },
        generateOptions() {
            if (!this.currentPhrase) {
                console.error('Current phrase is undefined or null');
                return;
            }
    
            const options = [this.currentPhrase.meaning];
            const phrasesLength = this.phrases.length;
            
            // Handle edge case when there are fewer than 4 unique meanings left
            while (options.length < 4) {
                const randomOption = this.phrases[Math.floor(Math.random() * phrasesLength)].meaning;
                options.push(randomOption);
            }
            this.options = options.sort(() => Math.random() - 0.5);
            
            console.log('Generated options:', this.options);
        },
        checkAnswer(selectedOption) {
            console.log('Checking answer...');
            if (selectedOption === this.currentPhrase.meaning) {
                this.score++;
            }
            if (this.phrases.length > 0) {
                this.nextPhrase();
            } else {
                console.log('All phrases answered. Ending game.');
                this.endGame();
            }
        },
        endGame() {
            this.gameOver = true;
            this.gameStarted = false;
            this.updateHighScore();
        },
        async startOver(){
            this.gameOver=false;
            this.gameStarted = false;
            this.gameStartGame = true;
            this.currentPhraseIndex = 0;
            await this.fetchPhrases(); // Ponownie wczytaj frazy
        },
        async updateHighScore() {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    if (this.score > userData.highScore) {
                        await setDoc(userDocRef, {
                            highScore: this.score
                        }, { merge: true });
                        this.highScore = this.score;
                    }
                }
            }
        },
        async loadHighScore() {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    this.highScore = userDoc.data().highScore;
                }
            }
        }
    },
    async mounted() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    this.uname_ = userDoc.data().username;
                    this.user = user;
                    this.loadHighScore();
                }
            } else {
                this.user = null;
                this.uname_ = ''; // Wyczyść nazwę użytkownika, jeśli użytkownik nie jest zalogowany
            }
        });
        await this.fetchPhrases();
        if (this.phrases.length === 0) {
            console.warn('No phrases available to start the game');
            this.gameOver = true;
        }
    }
});


appInstance.mount('#app');