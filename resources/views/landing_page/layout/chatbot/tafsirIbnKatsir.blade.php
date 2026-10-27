@extends('landing_page.partials.masterNoNav')
@section('content')
    <div class="question" id="app">
        <div class="container d-flex justify-content-between align-items-center">
            <a href="{{ route('home') }}" class="btn btn-sm btn-outline-success">Kembali</a>
            <h5 class="text-center mt-3" style="font-family: Poppins, sans-serif">ChatBot Tafsir Ibn Kathir</h5>
            <a type="button" v-on:click="resetQa" class="btn btn-sm btn-outline-success">Reset</a>
        </div>
        <div>
            <div id="message-Question" class="container messageQuestion">
                <div v-for="(dataQues, index) in pairedData" :key="index">
                    <div class="d-flex justify-content-end align-items-start gap-2">
                        @verbatim
                            <p class="questionUser">{{ dataQues . question . question }}
                            </p>
                        @endverbatim
                        <img class="muslim" src="{{ asset('assets/images/logo/muslim.svg') }}" alt="muslim"
                            width="32px">
                    </div>
                    <div class="d-flex align-items-start gap-2">
                        <img class="robot" src="{{ asset('assets/images/logo/bot.svg') }}" alt="bot" width="32px">
                        @verbatim
                            <p id="messageBot" class="messageBot" :style="{ backgroundColor: dataQues.answer.backgroundBot }">
                                {{ dataQues . answer . answer }}
                            </p>
                        @endverbatim
                    </div>
                </div>
                <div v-if="loadingBar" style="margin: 0 auto">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
            <div class="container inputanQuestion d-flex align-items-center">
                <input class="questionArea" id="question" v-model="question" type="text"
                    placeholder="tuliskan pertanyaan anda di sini ">
                <button type="submit" class="button-kirim" v-on:click="sendQuestion()"><i id="iconSend"
                        class="ri-send-plane-2-fill" style="color: #8DC63F; font-size: 2rem; margin-left: 8px"></i>
                </button>
            </div>
        </div>
    </div>
@endsection
@push('addon-script')
    <script src="/vendor/vue/vue.js"></script>
    <script src="https://unpkg.com/axios@1.1.2/dist/axios.min.js?v=2.2"></script>
    <script src="https://unpkg.com/vue-toasted"></script>
    <script>
        const apiTafsirIbnKathir = "{{ env('API_IBNKATHIR') }}"
        const apiInsert = "{{ env('API_INSERT_DB') }}"
        const userId = @json(Auth::user()->id);
        let app = new Vue({
            el: '#app',
            data() {
                return {
                    question: "",
                    answer: "",
                    allAnswer: [],
                    allQuestion: [],
                    loadingBar: false,
                }
            },
            mounted() {
                // keadaan saat pertama kali web di render
                Vue.use(Toasted)
            },
            computed: {
                pairedData() {
                    const result = [];
                    const maxCount = Math.max(this.allQuestion.length, this.allAnswer.length);

                    for (let i = 0; i < maxCount; i++) {
                        const question = this.allQuestion[i] || '';
                        const answer = this.allAnswer[i] || '';
                        const backgroundBot = "#c2e4be"


                        result.push({
                            question,
                            answer,
                            backgroundBot
                        });
                    }

                    return result;
                },
            },
            methods: {
                sendQuestion() {
                    let formData = new FormData()
                    if (this.question.trim() !== "") {
                        this.loadingBar = true
                        this.addDataQuestion()
                        formData.append('question', this.question.toLowerCase())
                        axios.post(apiTafsirIbnKathir, formData)
                            .then((resp) => {
                                // console.log(resp.data.question)
                                this.question = resp.data.question
                                this.answer = resp.data.answer
                                this.addDataToAnswer()
                                this.loadingBar = false

                                // insert db
                                formData.append('question', resp.data.question)
                                formData.append('answer', resp.data.answer)
                                formData.append('category', 'Quran')
                                formData.append('user_id', userId)
                                axios.post(apiInsert, formData)
                                    .then((resp) => {
                                        // console.log(resp.data)
                                    })
                                    .catch((err) => {
                                        console.log(err)
                                    })
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    } else {
                        this.$toasted.error('Pertanyaan tidak boleh kosong', {
                            position: 'top-center',
                            duration: 3000 // Durasi pesan (opsional)
                        });
                    }
                },
                addDataQuestion() {
                    let data = {
                        question: this.question
                    }
                    this.allQuestion.push(data)
                },
                addDataToAnswer() {
                    let data = {
                        answer: this.answer,
                        backgroundBot: '#c2e4be'
                    }
                    this.allAnswer.push(data)
                    this.question = ""
                },
                resetQa() {
                    this.question = "";
                    this.answer = "";
                    this.loadingBar = false;
                    this.allAnswer = [];
                    this.allQuestion = [];
                },
            },
        })
    </script>
@endpush
