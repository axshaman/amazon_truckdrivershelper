
/*
function pluginLoad() {

    if (chrome.runtime.id) {
  */

(function () {
    
    class Cargomatic {

        constructor() {
            this.load = false;
            this.status = false;
            this.timer = 300;

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
                    panel.insertAdjacentHTML('afterbegin', this.loadForm());

                    let modal = document.getElementById('jbModal');
                    modal.style.display = 'block';

                    let btnStart = modal.querySelector('.btn-start');
                    let status = document.getElementById('statusCargomatic');

                    let $resultBoard = document.getElementById('filter-summary__result-summary');
                    let $button = $resultBoard.nextElementSibling.querySelector('button');

                    let timerID = 0;
                    if (btnStart && status) {
                        btnStart.addEventListener('click', () => {
                            this.status = !this.status;

                            fetchClass.register();

                            console.log($button);
                            if (this.status) {
                                status.innerText = 'Включен';




                                if (!timerID) {
                                    timerID = setInterval(function () {

                                        //$button.click()
                                        console.log('$button.click()');



                                    }, this.timer);
                                    console.log(timerID)
                                }

                            } else {
                                status.innerText = 'Выключен';

                                if (timerID)
                                    clearInterval(timerID);

                            }
                        });
                    }


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
                '<h5 class="modal-title"><i class="fa fa-bolt"></i> Cargomatic</h5> ' +
                '</div>' +
                '<div class="modal-body">' +
                '<div class="client-warning alert alert-warning" style="display: none"></div> ' +
                '<div class="row refresh-type"> ' +
                '<div class="col-12"> ' +
                '<div class="row"> ' +
                '<div class="col-5">' +
                '<label for="">Refresh Type:</label>' +
                '</div> ' +
                '<div class="col-7"> ' +
                '<div class="row">' +
                '<div class="col-4"> ' +
                '<label class="radio"> <input checked="checked" name="refreshType" type="radio" value="fast"> Fast </label> ' +
                '</div> ' +
                '<div class="col-8"> ' +
                '<label class="radio"> <input disabled name="refreshType" type="radio" value="random"> Random </label> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '<div class="row"> ' +
                '<div class="col-5"> ' +
                '<label for="" class="mt-20">Refresh interval in milliseconds:</label> ' +
                '</div> ' +
                '<div class="col-7"> ' +
                '<input type="text" class="refresh-interval-slider" name="refreshInterval" id="refreshInterval" value="300"/> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '<div class="row mt-10 skip-states-container"> ' +
                '<div class="col-5"> ' +
                '<label for="">Skip States:</label> ' +
                '</div> ' +
                '<div class="col-7"> ' +
                '<select class="form-control select2 skip-states" name="skipStates[]" multiple="multiple"> ' +
                '<option value="AL">Alabama</option> <option value="AK">Alaska</option> <option value="AZ">Arizona</option> <option value="AR">Arkansas</option> <option value="CA">California</option> <option value="CO">Colorado</option> <option value="CT">Connecticut</option> <option value="DE">Delaware</option> <option value="DC">District Of Columbia</option> <option value="FL">Florida</option> <option value="GA">Georgia</option> <option value="HI">Hawaii</option> <option value="ID">Idaho</option> <option value="IL">Illinois</option> <option value="IN">Indiana</option> <option value="IA">Iowa</option> <option value="KS">Kansas</option> <option value="KY">Kentucky</option> <option value="LA">Louisiana</option> <option value="ME">Maine</option> <option value="MD">Maryland</option> <option value="MA">Massachusetts</option> <option value="MI">Michigan</option> <option value="MN">Minnesota</option> <option value="MS">Mississippi</option> <option value="MO">Missouri</option> <option value="MT">Montana</option> <option value="NE">Nebraska</option> <option value="NV">Nevada</option> <option value="NH">New Hampshire</option> <option value="NJ">New Jersey</option> <option value="NM">New Mexico</option> <option value="NY">New York</option> <option value="NC">North Carolina</option> <option value="ND">North Dakota</option> <option value="OH">Ohio</option> <option value="OK">Oklahoma</option> <option value="OR">Oregon</option> <option value="PA">Pennsylvania</option> <option value="RI">Rhode Island</option> <option value="SC">South Carolina</option> <option value="SD">South Dakota</option> <option value="TN">Tennessee</option> <option value="TX">Texas</option> <option value="UT">Utah</option> <option value="VT">Vermont</option> <option value="VA">Virginia</option> <option value="WA">Washington</option> <option value="WV">West Virginia</option> <option value="WI">Wisconsin</option> <option value="WY">Wyoming</option> ' +
                '</select> ' +
                '</div>' +
                '</div>     ' +
                '<div class="row mt-20"> ' +
                '<div class="col-5">' +
                '<label for="">Take Action:</label> ' +
                '</div> ' +
                '<div class="col-7"> ' +
                '<select class="form-control action-type"> ' +
                '<option value="notify_me_once">Notify Me Once</option> ' +
                '<option value="book">Book First Available</option> ' +
                '</select> ' +
                '</div> ' +
                '</div> ' +
                '<div class="row mt-20"> ' +
                '<div class="col-5">' +
                '<label for="">Status:</label> ' +
                '</div> ' +
                '<div class="col-7"> ' +
                '<span id="statusCargomatic">Выключен</span>' +
                '</div> ' +
                '</div> ' +
                '</div> ' +
                '<div class="modal-footer"> ' +
                '<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button> ' +
                '<button type="button" class="btn btn-jb btn-start">Start</button> ' +
                '</div> ' +
                '</div> ' +
                '</div>' +
                '</div> ';
        }


        isBoard() {
            return document.getElementsByClassName('available-work').length > 0
        }

    }


    class fetchClass {
        static ['register']() {
            this['isActive'] = false;
            this['isFirstRun'] = false;
            this['init']();
        }

        static ['activate']() {
            this['isActive'] = true;
        }

        static ['deactivate']() {
            this['isActive'] = false;
        }

        static ['setFirstRun']() {
            this['isFirstRun'] = true;
        }

        static ['init']() {
            this['initFetchProxy']();
        }

        static isSimilarMatch(data) {
            return data.indexOf(this['SIMILAR_URL']) > -1;
        }

        static injectEmptyWorkOpportunities(data, input) {
            if (data['ok']) {
                data['text']()['then'](item => {
                    this['setEmptyWorkOpportunities'](data, item, input);
                });
            } else {
                input(data);
            }
        }

        static ['setEmptyWorkOpportunities'](data, item, input) {
            try {
                item = JSON['parse'](item);
                item['workOpportunities'] = [];
                item['totalResultsSize'] = 0x0;
                item = JSON['stringify'](item);
            } catch (error) {
            }
            input(new Response(item, {
                'status': data['status'],
                'statusText': data['statusText'],
                'headers': data['headers']
            }));
        }

        /**
         * Proxi
         */
        static initFetchProxy() {
            console.log('initFetchProxy');

            const fixClass = this;
            const fetch = window.fetch;

            window.fetch = function () {
                console.log('Promise1');

                return new Promise((input, init) => {

                    let var1 = false;
                    let var2 = null;
                    console.log('Promise2');

                    let URL = arguments[0];
                    if (URL && URL.indexOf('&_innerChannel') > -1) {
                        var1 = true;
                        let urlParser = new URLSearchParams(URL);
                        let var2 = urlParser.get('_innerChannel');
                        arguments[0] = URL.replace('&_innerChannel=' + var2, '');
                    }

                    fetch.apply(this, arguments).then((data) => {
                        if (fixClass.isSimilarMatch(data['url'])) {
                            fixClass['injectEmptyWorkOpportunities'](data, input);
                        } else if (fixClass['isLoadBoard'](data['url']) && fixClass['isActive']) {
                            if (fixClass['isFirstRun']) {
                                fixClass['isFirstRun'] = false;

                                console.log('event1')
                                //_0x47bb8d['handle'](data, input);
                            } else if (var1) {
                                console.log('event2')
                                //_0x339013['handle'](data, input, var2);
                            }
                        } else {
                            input(data);
                        }
                    });
                });
            };


            console.log(window.fetch);
        }
    }




    function execute() {
        const cargomatic = new Cargomatic()
        cargomatic.start();
/*
        setTimeout(function () {
            fetchClass.register()
        }, 2000);
        */
    }

    execute();


    let scriptEl = document.createElement('script');
    scriptEl.innerText = `(function () { window.fetch = function () {
                console.log('Promise1');} }());`;
    document.body.appendChild(scriptEl);

}());

/*
    }

}

if (document.readyState === "complete" || (document.readyState !== "loading" && !document.documentElement.doScroll)) {
    pluginLoad();
} else {
    document.addEventListener("DOMContentLoaded", pluginLoad);
}*/