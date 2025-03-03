function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

function pluginLoad() {

    if (chrome.runtime.id) {

        class Cargomatic {

            constructor() {
                this.load = false;
                this.loadcount = 0;

                this.status = false;
                this.mode = 'manual';
                this.timer = 5000;
                this.countcar = 5;


                this.timerID = 0;

                this['isActive'] = true;
                this['isFirstRun'] = true;
                this['SIMILAR_URL'] = '/api/loadboard/similar?';
                this['LOAD_BOARD_URL'] = '/api/loadboard?';
            }

            getInfo() {
                let data = {};
                data.id = chrome.runtime.id;

                let cid_el = document.getElementById('case-carrier-scac');
                data.cid = cid_el ? cid_el.value : null;

                let cname_el = document['getElementById']('company-name');
                data.cname = cname_el ? cname_el.innerText.trim() : null;

                data.version = chrome.runtime.getManifest().version;

                let email_el = document.getElementById('case-user-email');
                data.email = email_el ? email_el.value : null;

                return data;
            }

            start() {
                let data = this.getInfo();

                if (data)
                    this.load = true;

                if (this.load && this.isBoard()) {
                    let panel = document.getElementById('filter-summary-panel');

                    if (panel) {
                        panel.parentNode.insertAdjacentHTML('afterbegin', this.loadForm());

                        let modal = document.getElementById('jbModal');
                        modal.style.display = 'block';

                        let btnStart = modal.querySelector('.btn-start');

                        /**
                         * изменение милисекунд
                         */
                        let interval = document.getElementById('refreshInterval');
                        if (interval) {
                            this.timer = parseInt(interval.value);


                            interval.addEventListener('change', ()=>{
                                this.timer = parseInt(interval.value);
                                if (this.timerID) {
                                    this.start___s()
                                }
                            });
                        }

                        /**
                         * Количество машин
                         * @type {HTMLElement}
                         */
                        let countcar = document.getElementById('countcar');
                        if (countcar) {

                            countcar.addEventListener('change', ()=>{
                                this.countcar = parseInt(countcar.value);
                                if (this.timerID) {
                                    this.start___s()
                                }
                            });
                        }


                        let $actionType = modal.querySelector('.action-type');
                        if ($actionType) {

                            $actionType.addEventListener('change', ()=>{
                                this.mode = $actionType.value;
                                if (this.timerID) {
                                    this.start___s()
                                }
                            });

                        }

                        if (btnStart) {
                            btnStart.addEventListener('click', () => {
                                this.status = !this.status;

                                if (this.status) {

                                    btnStart.innerText = 'Stop refresh';

                                    this.start___s()

                                } else {
                                    btnStart.innerText = 'Start refresh';

                                    this.stop___s()

                                }
                            });
                        }


                    }
                }


            }


            start___s() {

                if (this.timerID) {
                    clearInterval(this.timerID);
                    /**
                     * Нажимать на кнопку обновить
                     */
                    this.timerID = setInterval(()=>this.start___s_timer(), this.timer);

                } else {

                    let body = document.getElementById('base-container-body');

                    if (body) {

                        let $work = body.querySelector('.available-work');
                        if ($work) {

                            /**
                             * Нажимать на кнопку обновить
                             */
                            this.timerID = setInterval(()=>this.start___s_timer(), this.timer);

                            let vm = this;
                            let handler = function () {
                                vm.load_count();
                            }

                            $work.addEventListener('DOMNodeInserted', handler);
                        }
                    }
                }

            }
            stop___s() {


                if (this.timerID) {
                    clearInterval(this.timerID);
                    this.timerID = 0;
                    let body = document.getElementById('base-container-body');

                    if (body) {


                        let $work = body.querySelector('.available-work');
                        if ($work) {

                            let vm = this;
                            let handler = function () {
                                vm.load_count();
                            }
                            $work.removeEventListener('DOMNodeInserted', handler);
                        }
                    }
                }


            }

            load_count() {

                console.log('load_count');
                console.log(this.mode);
                console.log(this.loadcount);

                this.loadcount++;

                /**
                 * Весь контент загрузился
                 */
                if (this.loadcount === 4) {

                    /**
                     * Включен автовыбор
                     */
                    if (this.mode === 'book') {

                        let buttons = document.getElementsByClassName('wo-book-button');

                        if (buttons.length > 0) {

                            for (let j = 0; buttons.length; j++) {

                                if ( this.countcar > 0 && j >= this.countcar) {
                                    break;
                                }
                                sleep(50);
                                /**
                                 * Автовыбор
                                 */
                                let button = buttons[j];
                                console.log('$button card.click() '+ j);
                                console.log(button);
                                //button.click();

                            }
                        }
                    }

                    /**
                     * Готовность к новой загрузке
                     */
                    this.loadcount = 0;
                }
            }

            start___s_timer() {
                if (this.loadcount === 0) {

                    let $resultBoard = document.getElementById('filter-summary__result-summary');

                    if ($resultBoard) {
                        /**
                         * кнопка амазона
                         * @type {HTMLButtonElement}
                         */
                        let $button = $resultBoard.nextElementSibling.querySelector('button');

                        /**
                         * Нажать на кнопку
                         */
                        $button.click();
                        console.log('$button.click()');
                    }
                }
            }



            /**
             * отображение формы
             */
            loadForm() {
                // modal
                return '<div class=" fade  show jb-modal" id="jbModal" tabindex="-1" role="dialog" aria-hidden="true">' +
                    '<div class="modal-dialog" role="document">' +
                    '<div class="modal-content"> ' +
                    '<div class="modal-header"> ' +
                    '<h5 class="modal-title"><i class="fa fa-bolt"></i> Cargomatic v0.1</h5> ' +
                    '</div>' +
                    '<div class="modal-body">' +
                    '<div class="row refresh-type"> ' +
                    '<div class="col-12"> ' +
                    '<div class="row"> ' +
                    '<div class="col-5"> ' +
                    '<label for="" class="mt-20">Refresh interval in milliseconds:</label> ' +
                    '</div> ' +
                    '<div class="col-7"> ' +
                    '<input type="number" class="refresh-interval-slider form-control" name="refreshInterval" id="refreshInterval" value="5000"/> ' +
                    '</div> ' +
                    '</div> ' +
                    '</div> ' +
                    '</div> ' +
                    '<div class="row mt-3"> ' +
                    '<div class="col-5">' +
                    '<label for="">Take Action:</label> ' +
                    '</div> ' +
                    '<div class="col-7"> ' +
                    '<select class="form-control action-type"> ' +
                    '<option value="manual" selected>Manual mode</option> ' +
                    '<option value="book">Auto mode</option> ' +
                    '</select> ' +
                    '</div> ' +
                    '</div> ' +
                    '<div class="row mt-3"> ' +
                    '<div class="col-5">' +
                    '<label for="">Count books:</label> ' +
                    '</div> ' +
                    '<div class="col-7"> ' +
                    '<input type="number" class="form-control" name="countcar" id="countcar" value="5"/>' +
                    '</select> ' +
                    '</div> ' +
                    '</div> ' +
                    '</div> ' +
                    '<div class="modal-footer"> ' +
                    '<button type="button" class="btn btn-jb btn-start">Start refresh</button> ' +
                    '</div> ' +
                    '</div> ' +
                    '</div>' +
                    '</div> ';
            }


            isBoard() {
                return document.getElementsByClassName('available-work').length > 0
            }

        }



        new Cargomatic().start()
    }
}



if (document.readyState === "complete" || (document.readyState !== "loading" && !document.documentElement.doScroll)) {
    pluginLoad();
} else {
    document.addEventListener("DOMContentLoaded", pluginLoad);
}