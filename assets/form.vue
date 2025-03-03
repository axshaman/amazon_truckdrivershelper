<template>

    <div class="modal fade" role="dialog"  id="cargomatic_modal">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="fa fa-bolt"></i> Cargomatic</h5>
          </div>
          <div class="modal-body">
            <div class="refresh-type">
              <ul class="div">
                <li>Активен: {{ isActive }}</li>
                <li>Пауза: {{ isPaused }}</li>
                <li>Первый запуск: {{ isFirstRun }}</li>
                <li>Timer: {{ timerID }}</li>
                <li>ms: {{ cur_random }} </li>
                <li>запросов: {{ count_req }} - {{ count_time  }} сек. <span style="color: #b81d1d">~ {{ last_count_req }}</span></li>
              </ul>


              <div class="row">
                <div class="col-5">
                  <span>Refresh Type:</span>
                </div>
                <div class="col-7">

                  <div class="row">
                    <div class="col-4">
                      <input type="radio" :value="'fast'" id="refreshTypeFast" v-model="refreshType"><label class="radio" for="refreshTypeFast"> Fast </label>
                    </div>
                    <div class="col-8">
                      <input type="radio" :value="'random'" id="refreshTypeRandom" v-model="refreshType"><label class="radio" for="refreshTypeRandom"> Random </label>
                    </div>
                  </div>
                </div>
              </div>
              <div class="row mt-20">
                <div class="col-5">
                  <span>Refresh interval in milliseconds:</span>
                </div>
                <div class="col-7">
                  <div v-if="refreshType === 'fast'">
                    <input type="number" class="form-control" v-model="refreshInterval" />
                  </div>
                  <div v-else-if="refreshType === 'random'">
                    <div class="row">
                      <div class="col-6">
                        <input type="number" class="form-control" v-model="refreshIntervalStart" :min="90"  :max="1999"/>
                      </div>
                      <div class="col-6">
                        <input type="number" class="form-control" v-model="refreshIntervalEnd" :min="91"  :max="2000"/>
                      </div>
                    </div>


                  </div>
                </div>
              </div>
            </div>
            <div class="row mt-3 skip-states-container">
              <div class="col-5">
                <span>Skip States:</span>
              </div>
              <div class="col-7">

                <Select2 v-model="skipStates" :options="citiesVue" :settings="{'allowClear': true, 'width': '100%', 'multiple': true, 'closeOnSelect': false}" />
                <!--
                <select class="form-control select21 skip-states select2-hidden-accessible" name="skipStates[]" multiple="" tabindex="-1" aria-hidden="true" v-model="skipStates">
                  <option :value="key" v-for="(city, key) in cities" v-bind:key="key">{{ city }}</option>
                </select>
                -->
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-5">
                <span>Skip city type:</span>
              </div>
              <div class="col-7">
                <select class="form-control" v-model="skipCitiesType">
                  <option value="around">Первый или последний</option>
                  <option value="all">Все города</option>
                </select>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-5"><span>Take Action:</span></div>
              <div class="col-7">
                <select class="form-control" v-model="actionType">
                  <option value="notify">Notify Me Once</option>
                  <option value="book">Book First Available</option>
                </select>
              </div>
            </div>
            <template  v-if="actionType === 'book'">
              <div class="row mt-3">
                <div class="col-5"><span>Count books:</span></div>
                <div class="col-7">
                  <input type="number" class="form-control" v-model="countcar" :min="1" :max="30"/>
                </div>
              </div>

              <div class="row mt-3">
                <div class="col-5"></div>
                <div class="col-7">
                  <div class="custom-control custom-checkbox">
                    <input class="form-check-input" type="checkbox" v-model="one_book_empty" id="one_book_empty">
                    <label class="" for="one_book_empty">+ Empty Trailer</label>
                  </div>

                  <div class="d-inline ml-2 form-inline" v-if="one_book_empty">
                    <input type="number" class="form-control" v-model="one_book_empty_count" :min="1" :max="30"/>
                  </div>

                </div>
              </div>
            </template>
            <template v-else>
              <div class="row mt-5">
                <div class="col-5"></div>
                <div class="col-7">
                  <div class="custom-control custom-checkbox">
                    <input class="form-check-input" type="checkbox" v-model="one_click_book" id="one_click_book" @change="onOneClickBookChecked">
                    <label class="custom-control-label" for="one_click_book">One Click Book</label>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-start" :class="((actionType === 'book' && ( countcar > 0 || ( one_book_empty && one_book_empty_count > 0 ) || (successBook.length && isActive) )) || actionType === 'notify') ? 'btn-primary' : 'btn-secondary'" :disabled="!((actionType === 'book' && ( countcar > 0 || ( one_book_empty && one_book_empty_count > 0 ) || (successBook.length && isActive) )) || actionType === 'notify')" @click="startTimer" >{{ startText }}</button>
            <button type="button" class="btn btn-primary btn-start" @click="saveTimer" :disabled="!isCanSave">{{ saveText }}</button>
          </div>
        </div>
      </div>
    </div>
</template>

<script>

//import fakeFetch from './fakeFetch'
//import fakeFetchFirst from "./fakeFetchFirst";
//import fakeFetchNoFirst from "./fakeFetchNoFirst";

//import Select2 from './Select2';
import Select2 from 'vue3-select2-component';

export default {
  name: "cargomatic",
  components: {
    Select2
  },
  data() {
    return {
      openModal: 0,
      refreshType: 'fast',
      refreshInterval: 2000,
      refreshIntervalStart: 90,
      refreshIntervalEnd: 2000,
      actionType: 'notify',
      countcar: 1,
      one_click_book: false,
      one_click_book_timer: null,

      one_book_empty: false,
      one_book_empty_count: 1,

      _resultBoard: undefined,
      _button: undefined,
      _body: undefined,
      _work: undefined,

      timerID: 0,
      timerIDreset: 0,
      timerIDcount: 0,
      loadcount: 0,
      for_button: false,
      cur_random: 0,
      count_req: 0,
      last_count_req: 0,
      count_time: 0,

      isCanSave: false,
      startText: 'Start',
      saveText: 'Save',



      alertAudio: undefined,
      trashAudio: undefined,
      errorAudio: undefined,

      /** запрос для обновления */
      refresherResolver: null,
      refresherResponse: null,
      refresherJsonData: null,
      innerChannelCounter: 0, //
      innerPromises: {},
      errorCounts: 0,

      /** Переменные для работы счетчика  */

      isActive: false, // активная работа
      isFirstRun: false, // первый запуск
      isPaused: false, // на паузе
      isFetch: false, // запрос отправлен и не обработан


      // успешно принятые автоматические заявки
      successBook: [],

      currentWorkOpportunitiesIds: [], // полученные только что ID
      unsatisfiedWorkOpportunitiesIds: [], // ID которые были пропущенны оператором

      storage: {},

      skipStates: [],
      citiesVue: [
        {id: 'al', text: 'Alabama'},
        {id: 'ak', text: 'Alaska'},
        {id: 'az', text: 'Arizona'},
        {id: 'ar', text: 'Arkansas'},
        {id: 'ca', text: 'California'},
        {id: 'co', text: 'Colorado'},
        {id: 'ct', text: 'Connecticut'},
        {id: 'de', text: 'Delaware'},
        {id: 'dc', text: 'District of columbia'},
        {id: 'fl', text: 'Florida'},
        {id: 'ga', text: 'georgia'},
        {id: 'hi', text: 'Hawaii'},
        {id: 'id', text: 'Idaho'},
        {id: 'il', text: 'Illinois'},
        {id: 'in', text: 'Indiana'},
        {id: 'ia', text: 'Iowa'},
        {id: 'ks', text: 'Kansas'},
        {id: 'ky', text: 'Kentucky'},
        {id: 'la', text: 'Louisiana'},
        {id: 'me', text: 'Maine'},
        {id: 'md', text: 'Maryland'},
        {id: 'ma', text: 'Massachusetts'},
        {id: 'mi', text: 'Michigan'},
        {id: 'mn', text: 'Minnesota'},
        {id: 'ms', text: 'Mississippi'},
        {id: 'mo', text: 'Missouri'},
        {id: 'mt', text: 'Montana'},
        {id: 'ne', text: 'Nebraska'},
        {id: 'nv', text: 'Nevada'},
        {id: 'nh', text: 'New Hampshire'},
        {id: 'nj', text: 'New Jersey'},
        {id: 'nm', text: 'New Mexico'},
        {id: 'ny', text: 'New York'},
        {id: 'nc', text: 'North Carolina'},
        {id: 'nd', text: 'North Dakota'},
        {id: 'oh', text: 'Ohio'},
        {id: 'ok', text: 'Oklahoma'},
        {id: 'or', text: 'Oregon'},
        {id: 'pa', text: 'Pennsylvania'},
        {id: 'ri', text: 'Rhode Island'},
        {id: 'sc', text: 'South Carolina'},
        {id: 'sd', text: 'South Dakota'},
        {id: 'tn', text: 'Tennessee'},
        {id: 'tx', text: 'Texas'},
        {id: 'ut', text: 'Utah'},
        {id: 'vt', text: 'Vermont'},
        {id: 'va', text: 'Virginia'},
        {id: 'wa', text: 'Washington'},
        {id: 'wv', text: 'West Virginia'},
        {id: 'wi', text: 'Wisconsin'},
        {id: 'wy', text: 'Wyoming'},
      ],

      skipCitiesType: 'all',
      skipCities: [],


      cities: {
        'al': 'Alabama',
        'ak': 'Alaska',
        'az': 'Arizona',
        'ar': 'Arkansas',
        'ca': 'California',
        'co': 'Colorado',
        'ct': 'Connecticut',
        'de': 'Delaware',
        'dc': 'District of columbia',
        'fl': 'Florida',
        'ga': 'georgia',
        'hi': 'Hawaii',
        'id': 'Idaho',
        'il': 'Illinois',
        'in': 'Indiana',
        'ia': 'Iowa',
        'ks': 'Kansas',
        'ky': 'Kentucky',
        'la': 'Louisiana',
        'me': 'Maine',
        'md': 'Maryland',
        'ma': 'Massachusetts',
        'mi': 'Michigan',
        'mn': 'Minnesota',
        'ms': 'Mississippi',
        'mo': 'Missouri',
        'mt': 'Montana',
        'ne': 'Nebraska',
        'nv': 'Nevada',
        'nh': 'New Hampshire',
        'nj': 'New Jersey',
        'nm': 'New Mexico',
        'ny': 'New York',
        'nc': 'North Carolina',
        'nd': 'North Dakota',
        'oh': 'Ohio',
        'ok': 'Oklahoma',
        'or': 'Oregon',
        'pa': 'Pennsylvania',
        'ri': 'Rhode Island',
        'sc': 'South Carolina',
        'sd': 'South Dakota',
        'tn': 'Tennessee',
        'tx': 'Texas',
        'ut': 'Utah',
        'vt': 'Vermont',
        'va': 'Virginia',
        'wa': 'Washington',
        'wv': 'West Virginia',
        'wi': 'Wisconsin',
        'wy': 'Wyoming'
      }
    }
  },

  mounted() {
    this._resultBoard = document.getElementById('filter-summary__result-summary');


    if (this._resultBoard ) {


      this._button = this._resultBoard.nextElementSibling.querySelector('button');


      this._body = document.getElementById('base-container-body');

      if (this._body) {
        this._work = this._body.querySelector('.available-work')
      }

      if (typeof (localStorage) === 'undefined') {
        this.isCanSave = false;
      } else {
        this.isCanSave = true;

        if (localStorage.hasOwnProperty('cargomatic')) {

          let data = JSON.parse(localStorage.getItem('cargomatic'));

          this.openModal = data.openModal;
          this.refreshType = data.refreshType;
          this.refreshInterval = parseInt(data.refreshInterval);
          this.refreshIntervalStart = parseInt(data.refreshIntervalStart);
          this.refreshIntervalEnd = parseInt(data.refreshIntervalEnd);
          this.actionType = data.actionType;
          this.countcar = parseInt(data.countcar ?? 1);
          this.one_click_book = data.one_click_book === 1;

          this.one_book_empty = data.one_book_empty === 1;
          this.one_book_empty_count = parseInt(data.one_book_empty_count);

          if (this.one_click_book) {
            this.onOneClickBookChecked();
          }


        }

      }

      //console.log('new 123');


      this.alertAudio = new Audio('https://junglebark.com/assets/sounds/beep.mp3');
      this.trashAudio = new Audio('https://junglebark.com/assets/sounds/trash.mp3');
      this.errorAudio = new Audio('https://junglebark.com/assets/sounds/error.mp3');


      // запуск прокси
      this.initFetchProxy();


      let headElement = document.head;
      let cssSelect2 = document.createElement('link');
      cssSelect2['type'] = 'text/css';
      cssSelect2['rel'] = 'stylesheet';
      //cssSelect2['href'] = 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css';
      cssSelect2['href'] = 'https://dev.itsai.org/app.css';
      headElement.appendChild(cssSelect2);
/*
      let jsSelect2 = document.createElement('script');
      jsSelect2.type = 'text/javascript';
      jsSelect2.src = 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js';
      jsSelect2.onload = function () {
        $('.select21').select2({'allowClear': true, 'width': '100%'})
      }
      headElement.appendChild(jsSelect2);
*/
    }

  },

  computed: {

  },

  methods: {

    /**
     * Случайная величина в зависимости от выбранных параметров
     */
    get_random() {

      this.count_req++;
      if (this.refreshType === 'fast') {

        let v = Math.round((Math.random()*50)+50);
        if (Math.random() < 0.5) {
          v *= -1
        }
        return this.cur_random =  Math.round(parseInt(this.refreshInterval) + v);

      } else if (this.refreshType === 'random') {


        let start = parseInt(this.refreshIntervalStart);
        let end = parseInt(this.refreshIntervalEnd);
        return this.cur_random =  Math.round((Math.random()*(end - start)) + start);

      } else {
        return this.cur_random =  Math.round((Math.random()*1000)+1000);
      }

    },

    /** Старые классы */

    // поиск в URL similar
    isSimilarMatch(url) {
      return url.indexOf( '/api/loadboard/similar?' ) !== -1;
    },

    // что запрос отправлен c доски
    isLoadBoard(url) {
      return url.indexOf('/api/loadboard?') !== -1;
    },

    // запись полученных ID
    setCurrentWorkOpportunitiesIds(workOpportunities) {
      this.currentWorkOpportunitiesIds.length = 0;
      for (let i = 0; i < workOpportunities.length; i++) {
        this.currentWorkOpportunitiesIds.push(workOpportunities[i].id);
      }
    },

    // возврат новых записей с проверкой на уникальность
    getNewWorkOpportunities(workOpportunities) {
      let array = [];
      for (let i = 0; i < workOpportunities.length; i++) {

        if (!this.unsatisfiedWorkOpportunitiesIds.includes(workOpportunities[i].id))
          array.push(workOpportunities[i]);
      }

      return array
    },

    // только подходящие для работы заказы ( учет города )
    getSatisfiedWorkOpportunities( data ) {

      let array = this.getNewWorkOpportunities(data);
      let noStatesResult = [];

      // учет города, который надо пропустить
      let states = [];
      if (this.skipStates && this.skipStates.length) {
        states = this.skipStates.map(function (state) {
          return state.toLowerCase();
        });
      }

      let statesResult = [];


      let SitesItem = '';
      let StatesItem = '';
      let StatesItemTemp = '';
      let isStart = false;

      for (let j = 0; j < array.length; j++) {
        let message = '';
        let item = array[j];
        let noStates = true;
        if (states.length) {
          let stopStates = this.getWorkOpportunityStopStates(item);

          if (stopStates.length) {
            for (let k = 0; k < stopStates.length; k++) {
              let stopStatesItem = stopStates[k];


              // Полное название штата
              if (stopStatesItem.length > 2) {


                let stopStatesItemTemp = ''
                for (let index in this.cities) {
                  if (this.cities[index].toLowerCase() === stopStatesItem.toLowerCase()) {
                    stopStatesItemTemp = index;
                    break;
                  }
                }
                if (stopStatesItemTemp.length) {
                  stopStatesItem = stopStatesItemTemp;
                }

              }


              if (states.includes(stopStatesItem.toLowerCase())) {
                message += 'State:\x20' + stopStatesItem + '\x20';
                noStates = false;
                break;
              }
            }
          }
        }


        /**
         * Скип по городам
         * */
        itemsfor:
          if (this.skipCities.length) {


            isStart = false;

            if (this.skipCitiesType === 'around') {
              isStart = true;
            }
            let k = 0
            let l = 0

            for (; k < item['loads'].length; k++) {
              l = 0
              for (; l < item['loads'][k]['stops'].length; l++) {
                try {
                  if (this.skipCitiesType === 'around') {
                    if (isStart) {
                      // первый город
                      SitesItem = item['loads'][k]['stops'][l]['location']['city'];
                      // первый штат
                      StatesItem = item['loads'][k]['stops'][l]['location']['state'];

                      StatesItemTemp = '';
                      if (StatesItem.length > 2) {
                        // полное название
                        let stopSitesItemTemp = ''
                        for (let index in this.cities) {
                          if (this.cities[index].toLowerCase() === StatesItem.toLowerCase()) {
                            StatesItemTemp = index;
                            break;
                          }
                        }
                        if (StatesItemTemp.length) {
                          StatesItem = StatesItemTemp;
                        }
                      }

                      for (let z=0; z<this.skipCities.length;z++) {
                        let item_z = this.skipCities[z];
                        if (item_z.city === SitesItem && StatesItem.toUpperCase() === item_z.state) {
                          noStates = false;
                          break itemsfor;
                        }
                      }
                      isStart = false;
                    }
                  } else {
                    // любой город
                    SitesItem = item['loads'][k]['stops'][l]['location']['city'];
                    // любой штат
                    StatesItem = item['loads'][k]['stops'][l]['location']['state'];

                    StatesItemTemp = '';
                    if (StatesItem.length > 2) {
                      // полное название
                      let stopSitesItemTemp = ''
                      for (let index in this.cities) {
                        if (this.cities[index].toLowerCase() === StatesItem.toLowerCase()) {
                          StatesItemTemp = index;
                          break;
                        }
                      }
                      if (StatesItemTemp.length) {
                        StatesItem = StatesItemTemp;
                      }
                    }

                    for (let z=0; z<this.skipCities.length;z++) {
                      let item_z = this.skipCities[z];
                      if (item_z.city === SitesItem && StatesItem.toUpperCase() === item_z.state) {
                        noStates = false;
                        break itemsfor;
                      }
                    }
                  }
                } catch (error) {

                }
              }
            }
            if (this.skipCitiesType === 'around') {
              // последний город
              SitesItem = item['loads'][(k - 1)]['stops'][(l - 1)]['location']['city'];
              // любой штат
              StatesItem = item['loads'][(k - 1)]['stops'][(l - 1)]['location']['state'];

              StatesItemTemp = '';
              if (StatesItem.length > 2) {
                // полное название
                let stopSitesItemTemp = ''
                for (let index in this.cities) {
                  if (this.cities[index].toLowerCase() === StatesItem.toLowerCase()) {
                    StatesItemTemp = index;
                    break;
                  }
                }
                if (StatesItemTemp.length) {
                  StatesItem = StatesItemTemp;
                }
              }

              for (let z=0; z<this.skipCities.length;z++) {
                let item_z = this.skipCities[z];
                if (item_z.city === SitesItem && StatesItem.toUpperCase() === item_z.state) {
                  noStates = false;
                  break itemsfor;
                }
              }
            }
          }


        /**
         * Скип по пустым треллерам
         * */
        /*
        if (this.one_book_empty) {

          // заказ с пустым
          if (item['loads'][0].loadType === 'EMPTY') {

          }
          // LOADED

          //this.one_book_empty_count
        }*/





        if (noStates) {
          noStatesResult['push'](item);
        } else {
          statesResult['push']({'id': item['id'], 'message': message});
        }
      }

      if (array.length && noStatesResult.length === 0 && statesResult.length) {
          // EVENT_UNSATISFIED_LOAD
          let data = [];
          for (let t = 0, d = statesResult['length']; t < d; t++) {
            if (!this.getUnsatisfiedWorkOpportunitiesIds().includes(statesResult[t]['id'])) {
              this.setUnsatisfiedWorkOpportunityId(statesResult[t]['id']);
              data.push(statesResult[t]['message']);
            }
          }
          if (data['length']) {
            // смена текста крутилки
            //_0x3c2533['unsatisfiedLoads'](data);
            this.trash();
          }
      }

      // учет пути
      //console.log('noStatesResult');
      //console.log(noStatesResult);

      return noStatesResult; // возвращаем весь массив

    },

    // неудовлетворенные возможности работы
    getUnsatisfiedWorkOpportunitiesIds() {
      return this.unsatisfiedWorkOpportunitiesIds;
    },

    setUnsatisfiedWorkOpportunityId(item) {
      return this.unsatisfiedWorkOpportunitiesIds.push(item);
    },

    // исключение определенныъ штатов
    getWorkOpportunityStopStates(item) {
      let data = [];

      for (let k = 0; k < item['loads'].length; k++) {
        for (let l = 0; l < item['loads'][k]['stops'].length; l++) {
          data['push'](item['loads'][k]['stops'][l]['location']['state'].toLowerCase());
        }
      }

      return data;
    },


    // подсветить элемнт
    highlightLoad(id, isBook = false) {

      let interval = setInterval(function () {
        let $woCard = document.getElementById(id);


        if ($woCard) {


          let $woCardHeader = $woCard.getElementsByClassName('wo-card-header');

          if (!$woCardHeader.length) {
            $woCardHeader = $woCard.getElementsByClassName('wo-card-header--highlighted');
          }




          if ($woCardHeader.length) {
            clearInterval(interval);
            $woCardHeader[0].style.backgroundColor = '#88cea9';
            $woCardHeader[0].style.webkitAnimation = 'none';


            if (isBook) {
              let $woCardButtons = $woCard.getElementsByClassName('wo-book-button');
              if ($woCardButtons.length) {
                let $woCardButton = $woCardButtons[0];
                $woCardButton.parentNode.innerHTML = 'Booked';
                //$woCardButton.parentNode.removeChild($woCardButton);
              }
            }
          }
        }
      }, 50);
      setTimeout(function () {
        clearInterval(interval);
      }, 1000);

    },

    // воспроизведение аудио уведомления
    alert() {
      this.alertAudio.play();
    },

    trash() {
      this.trashAudio.play();
    },

    error() {
      this.errorAudio.play();
    },

    // изменение быстрого нажатия
    onOneClickBookChecked() {

      if (this.one_click_book) {
        this.one_click_book_timer = setInterval( ()=>{
          this.buildAcceptButton();
        }, 20);
      } else {
        clearInterval(this.one_click_book_timer);
        if (!this.isActive) {
          this._button.click();
        }
      }

    },

    // на все кнопки вешается событие быстрого принятия
    buildAcceptButton() {
      let woBookButtons = document.getElementsByClassName('wo-book-button')

      for (let i=0;i<woBookButtons.length;i++){

        let button = woBookButtons[i];

        if (button.textContent === 'Book'){
          button.querySelector('span').textContent = 'Accept';
          button.style.backgroundColor = '#6a5acd';
          button.style.color = '#fff';
          button.style.color = '#fff';
          button.addEventListener('click', this.autoConfirm)
        }
      }
    },

    // быстрое принятие
    autoConfirm() {
      let index = 0;

      //console.log('autoConfirm');

      let timer = setInterval(function () {
        index++;

        if (index > 4) {
          clearInterval(timer);
          alert('If you see this error contact to Support. #1003');
        }



        let modal = document.getElementsByClassName('css-gt9nmi');
        //console.log(modal);
        if (modal.length) {



          let footer = modal[0].getElementsByTagName('footer')

          let parentModal = modal[0].parentElement;

          if (footer.length) {


            let buttons = footer[0].getElementsByTagName('button');

            if (buttons.length) {

              let btn = buttons[buttons.length-1];

              if (btn.textContent === 'Yes, confirm booking') {
                clearInterval(timer);
                //console.log('autoBook click');
                //console.log(index);
                //console.log(btn);

                parentModal.parentNode.removeChild(parentModal);

                //modal[0].parentNode.removeChild(modal[0]);
                btn.click();
              }

            }
          }
        }
      }, 1);
    },

    // инициализация Прокси
    initFetchProxy() {
      //console.log('initFetchProxy');

      const $vm = this;
      const fetch = window.fetch;


      window.fetch = function () {
        return new Promise((resolve, reject) => {

          let isInnerChannel = false;
          let innerChannel = null;
          let exclusionCitiesFilter = null;
          let URL = arguments[0];


          if (URL && URL.indexOf('&_innerChannel') > -1) {

            isInnerChannel = true;
            let urlParser = new URLSearchParams(URL);
            innerChannel = urlParser.get('_innerChannel');
            // исключение по городам
            exclusionCitiesFilter = urlParser.get('exclusionCitiesFilter');



            arguments[0] = URL.replace('&_innerChannel=' + innerChannel, '');
          }


          if (exclusionCitiesFilter !== null) {
             // , - разделение
             // _ - город_штат
            $vm.skipCities.length = 0;
            let temp_skipCities = exclusionCitiesFilter.split(',')
            temp_skipCities.forEach(function(item, i, arr) {
              let r = item.split('_');
              $vm.skipCities.push({
                'city': r[0],
                'state': r[1],
              })
            });
          }


          fetch.apply(this, arguments).then((data) => {

            if ($vm.isSimilarMatch(data.url)) {
              //$vm.injectEmptyWorkOpportunities(data, input);
            } else if ($vm.isLoadBoard(data.url) && $vm.isActive) {

              if ($vm.isFirstRun) {
                $vm.isFirstRun = false;


                //$vm.handleFetchFirst(data, resolve);
                $vm.handleFetchFirst(data, resolve);
              } else if (isInnerChannel) {
                $vm.handle(data, resolve, innerChannel);
              }



              //$vm.handle(data, resolve, isFirst);
              /*
              if ($vm.isFirstRun) {
                console.log('isFirstRun');
                $vm.isFirstRun = false;
                $vm.handleFetchFirst(data, input);
              } else if (isInnerChannel) {
                console.log('_innerChannel');
                console.log('event2')
                //fakeFetchNoFirst.handle(data, input, innerChannel);
              }
              */
            } else {
              resolve(data)
            }
          });
        });
      };

    },


    // обработка запроса
    handle(data, resolve, innerChannel) {


      let $vm = this;

      this.errorCounts = 0;


      if (data.ok) {



        data.text().then(response  => {

          if ($vm.isActive && !$vm.isPaused) {


            $vm.removePromise(innerChannel);

            let json = JSON.parse(response);


            // занесение данных в storage
            $vm.storage = json['carrierDetails'];

            let workOpportunities = json.workOpportunities;

            // получение только новых объектов
            let opportunities = $vm.getNewWorkOpportunities(workOpportunities);

            if (opportunities.length) {

              let satisfied =  $vm.getSatisfiedWorkOpportunities(opportunities);

              if (satisfied.length) {

                if ($vm.actionType === 'notify') {
                  $vm.stopTimer();
                }
                // остановка
                $vm.abortPromises();




                //let $items = []


                if ($vm.actionType === 'notify') {

                  for (let j = 0; j < satisfied.length; j++) {

                    $vm.highlightLoad(satisfied[j].id)
                    //$items.push(item);
                  }
                  $vm.stop(satisfied)
                  this.alert();

                } else if ($vm.actionType === 'book') {


                  let lostItem = $vm.countcar
                  let lostEmpty = 0;
                  if ($vm.one_book_empty && $vm.one_book_empty_count) {
                    lostEmpty = $vm.one_book_empty_count;
                    lostItem += lostEmpty;
                  }

                  //console.log('lostItem '+lostItem);
                  //console.log('lostEmpty '+lostEmpty);

                  let k = 0, l = 0;

                  for (let j = 0; j < satisfied.length; j++) {

                    let item = satisfied[j];
                    // доступны пустые трелееры
                    if (l < lostEmpty) {
                      // заказ на пустой треллер
                      if (item.loads[0].loadType === 'EMPTY') {

                        //console.log('item: '+item.id + ' is empty');

                        $vm.autoBook(data.url, item, k + l === lostItem);
                        l++

                      } else
                        // проверяем доступны ли нам обычные треллеры
                        if (k < $vm.countcar) {

                          //console.log('item: '+item.id + ' is empty, but common');

                          $vm.autoBook(data.url, item, k + l === lostItem);
                          k++;
                      }

                    } else
                      // Пустые треллеры кончились, но у нас есть обычный
                      if (k < $vm.countcar) {
                        //console.log('item: '+item.id + ' but common');
                        $vm.autoBook(data.url, item, k + l === lostItem);
                        k++;
                    }


                  }


                  if (( k === 0 && l === 0 ) || ( k > 0 && k < $vm.countcar ) || ( l > 0 && l < lostEmpty ) ) {
                    this.isFetch = false;
                    //console.log('конец запроса6');
                  }

                }

                /*
                for (let j = 0; j < satisfied.length; j++) {


                  let item = satisfied[j];

                  if ($vm.actionType === 'notify') {

                    // отправка данных на сервер //

                    // подсветка
                    $vm.highlightLoad(item.id)

                    $items.push(item);

                  } else if ($vm.actionType === 'book') {


                    console.log(j);
                    console.log($vm.countcar);

                    if (j < $vm.countcar) {
                     $vm.autoBook(data.url, item)
                    }


                    //console.log($vm.successBook.length);
                    //console.log($vm.countcar);
                    //console.log('push');


                    // book
                  }
                }


                //$vm.stop(satisfied)




                if ($vm.actionType === 'book') {

                  if ($vm.successBook.length && $vm.countcar === 0) {

                    $vm.isActive = false;

                    $vm.stop($vm.successBook)

                    for (let r = 0; r < $vm.successBook.length; r++) {
                      let item = $vm.successBook[r];
                      $vm.highlightLoad(item['id'], true);
                    }


                    console.log($vm.successBook);
                    console.log('stopTimer');

                    $vm.stopTimer();

                  } else {
                    $vm.isPaused = false;
                  }

                } else {
                  $vm.stop(satisfied)
                }
                this.alert();
                */
              }
            } else {
              this.isFetch = false;
              //console.log('конец запроса2');
            }
          }

          //console.log('конец запроса5');
          resolve(data)
        });


      } else {

        this.isFetch = false;
        //console.log('конец запроса3');
        this.error();
      }


      resolve(data)
    },


    // обработка первого запроса
    handleFetchFirst(data, resolver) {
      let $vm = this;
      //this.reset();
      // данные для последующих обновлений
      this.refresherResolver = resolver;
      this.refresherResponse = data;

      this.innerChannelCounter = 0;
      this.innerPromises = {};

      if (data.ok) {
        data.text().then(response => {
          //let json = ;

          $vm.refresherJsonData = JSON.parse(response);

          // заполнение storage
          //$vm.storage = json['carrierDetails'];

          // очистить неудачные заказы
          /**
           * @todo удалить
           * */
          //this.unsatisfiedWorkOpportunitiesIds = [];

          // Сами данные с заказами
          //$vm.setCurrentWorkOpportunitiesIds(json.workOpportunities);


          // запуск нового таймера
          $vm.timerID = setTimeout(() => this.start___refresh(data.url), this.get_random())

        });
      } else {
        this.stopTimer()
      }
    },

    // вернуть подготовленный запрос
    info() {
      return this.storage;
    },

    // сборка запроса
    bp(item, info) {

      let data = {
        'totalCost': {}
      };
      data['totalCost']['value'] = item['payout']['value'];
      data['totalCost']['unit'] = item['payout']['unit'];
      data['searchUrl'] = '';
      data['isCarrierEligibleForOneDayPayment'] = info['isCarrierEligibleForOneDayPayment'];
      let TAG ='BROKERAGE';
      try {
        let nexusMetaData = window.optimus.nexusMetaData;
        if (nexusMetaData && nexusMetaData['carrierServices'] && nexusMetaData['carrierServices']['includes']('DEDICATED')) {
          TAG = 'DEDICATED';
        }
      } catch (error) {
      }
      data['auditContextMap'] = {
        'rlbChannel': 'EXACT_MATCH',
        'searchResultIndex': '0',
        'workOpportunityId': item['id'],
        'workOpportunityType': item['workOpportunityType'],
        'time': new Date().getTime().toString(),
        'carrierPerformanceCategory': info['carrierPerformanceCategory'],
        'priorityAccessVersion': info['priorityAccessVersion'],
        'isPriorityAccessEnabled': false,
        'isOneDayPaymentEligible': !!info['isCarrierEligibleForOneDayPayment'],
        'isPickupTimeChanged': false,
        'originalPickupTime': item['firstPickupTime'],
        'newPickupTime': item['startTime'] ? item['startTime'] : item['firstPickupTime'],
        'truckCapacityOrderVersion': '',
        'carrierType': TAG,
        'searchSource': ''
      };
      data['auditContextMap'] = JSON.stringify(data['auditContextMap']);
      return data;
      
    },

    // получение csrf защиты
    csrf() {
      let meta = Array.from(document.getElementsByTagName('meta')).filter(function (item) {
        return 'x-csrf-token' === item.getAttribute('name');
      });
      return 1 === meta.length ? meta[0].getAttribute('content') : '';
    },

    // автоматическое принятие заявки
    autoBook(url, item, isLast) {

      let data = this.bp(item, this.info());

      let fetch_url = '/api/loadboard/' + item['id'] + '/' + item['version'] + '/option/' + item['workOpportunityOptionId'];


      //console.log('отправка запроса o BOOK')
      //console.log(data)
      //console.log(fetch_url)

      //fetch_url = '/api/loadboard123123123123/';
      //fetch_url = 'https://dev.itsai.org/api_loadboard';
      //data = {};

      this.abortPromises();

      let $vm = this;

      //console.log(item)

      //console.log('fetch');


      fetch(fetch_url, {
        'headers': {'x-csrf-token': this.csrf(), 'content-type': 'application/json'},
        'method': 'POST',
        'mode': 'cors',
        //'mode': 'no-cors',
        'credentials': 'same-origin',
        'body': JSON.stringify(data)
      }).then(response => {


       //console.log('autoBook response:')
       //console.log(response.ok)





        //$vm.errorCounts++;


        if (response['ok']) {
          // остановка

          //$vm.isActive = false;
          //$vm.stop([item])

          //$(document)['trigger'](_0x598b24['EVENT_STOP'], [item]);

          // подкрасить выбранные

          //считать количесво успешных заявок

          // test

          if ($vm.one_book_empty && $vm.one_book_empty_count && item.loads[0].loadType === 'EMPTY') {
            $vm.one_book_empty_count--;
          } else {
            $vm.countcar--;
          }

          $vm.successBook.push(item);
          $vm.unsatisfiedWorkOpportunitiesIds.push(item['id']);

          /*
          $vm.successBook.push(item);
          $vm.unsatisfiedWorkOpportunitiesIds.push(item['id']);
          $vm.countcar--;
          */

          //$vm.highlightLoad(item['id'], true);

          // booked - отправка события на сервер JB

          // звук
          //$vm.alert()
        } else {
          // отжать паузу
          //$vm.isPaused = false;
          $vm.errorCounts++;

          // уведомление
          // сообщение на спинере
          //_0x3c2533['expiredLoad']();

          // сохранение данных в Storage
          // отправка данных на сервер JB

          // уведомление
          //$vm.alert()
        }


        /*
        console.log('isLast: '+isLast);
        console.log('errorCounts: '+$vm.errorCounts);
        console.log('successBook: '+$vm.successBook.length);
        console.log('countcar: '+$vm.countcar);
        console.log('one_book_empty: '+$vm.one_book_empty);
        console.log('one_book_empty_count: '+$vm.one_book_empty_count);
*/

        // проверка в запросе

        let lost = $vm.countcar;
        if ($vm.one_book_empty) {
          lost += $vm.one_book_empty_count;
        }

        if ($vm.successBook.length && lost === 0) {

          $vm.isActive = false;

          $vm.stop($vm.successBook)

          $vm.stopTimer();

          for (let r = 0; r < $vm.successBook.length; r++) {
            $vm.highlightLoad($vm.successBook[r].id, true);
          }

          /*
          console.log($vm.successBook);
          console.log('stopTimer');
          */

          $vm.isFetch = false;

        } else if (isLast) {

          if ($vm.errorCounts) {
            $vm.isPaused = false;
            $vm.alert()
          }
          $vm.isFetch = false;

        }

      });


    },

    // остановка и вывод заявков
    stop(data) {
      // сборка запроса
      if (this.refresherResolver) {
        this.refresherJsonData.totalResultsSize = 0;
        this.refresherJsonData.workOpportunities = [];
        if (data) {
          this.refresherJsonData.totalResultsSize = data.length;
          this.refresherJsonData.workOpportunities = data;
        }
        this.refresherResolver(new Response(JSON.stringify(this.refresherJsonData), {
          'status': this.refresherResponse.status,
          'statusText': this.refresherResponse.statusText,
          'headers': this.refresherResponse.headers
        }));
      }

      this.isFetch = false;
      //console.log('конец запроса1');
    },

    // остановка таймера
    stopTimer() {

      this.startText = 'Start';

      this.isActive = false;
      this.isPaused = true;
      this.isFetch = false;

      if (this.timerID) {
        clearInterval(this.timerID);
        this.timerID = 0;
        this.startText = 'Start';
      }

      if (this.timerIDreset) {
        clearInterval(this.timerIDreset)
        this.timerIDreset = 0

      }

      if (this.timerIDcount) {
        clearInterval(this.timerIDcount)
        this.timerIDcount = 0;
        this.count_time = 0
      }

    },

    // старт таймера
    startTimer() {

      if (this.timerID) {

        // принудительная остановка таймера
        this.stopTimer()

        setTimeout(() => {
          this._button.click();
        }, 500);

      } else {

        if (this._work &&  this._button) {
          /**
           * Нажимать на кнопку обновить
           */
          this.isActive = true
          this.isPaused = false
          this.isFirstRun = true
          this.startText = 'Stop';
          this.count_req = 0;

          if (this.countcar === '')
            this.countcar = 0
          else
            this.countcar = parseInt(this.countcar)

          if (this.one_book_empty_count === '')
            this.one_book_empty_count = 0
          else
            this.one_book_empty_count = parseInt(this.one_book_empty_count)


          this.successBook = [];

          // вы будете видеть только новые заявки

          let $card = this._work.getElementsByClassName('wo-card');

          for(let i=0;i<$card.length;i++) {

            let id = $card[i].getAttribute('id')
            // все текущие задачи неактуальны
            this.unsatisfiedWorkOpportunitiesIds.push(id);
          }




          // основить автоматическое обновление
          let autoUpdate = this._resultBoard.nextElementSibling.querySelector('button.css-aoe6p2');

          if (autoUpdate) {
            let isActive = autoUpdate.querySelector('.fa-pause-circle');
            if (isActive) {
              autoUpdate.click();
            }
          }

          // один запуск
          this.timerID = setTimeout(()=>{
            this.start___s_timer()
          }, this.get_random());

          //console.log( this.timerID );


          let $vm = this;
          this.timerIDreset = setInterval(function (){
            $vm.last_count_req = $vm.count_req;
            $vm.count_req = 0;
            $vm.count_time = 0;
          }, 10000);

          this.timerIDcount = setInterval(function (){
            $vm.count_time++;
          }, 1000);

        }

      }
    },

    // старт случайного
    start___refresh(url) {


      if (!this.isPaused && this.isActive) {


        if (!this.isFetch) {
          this.isFetch = true;
          //console.log('начало запроса');
          this.innerChannelCounter++;
          this.innerPromises['t' + this.innerChannelCounter] = this.abortableFetch(url + '&_innerChannel=' + this.innerChannelCounter);
        }
        this.timerID = setTimeout(()=>{

          this.start___refresh(url)
        }, this.get_random());

      }
    },

    // запуск таймера
    start___s_timer() {

      if (this.loadcount === 0 && this._button) {
        this._button.click();
        //console.log('$button.click()');
      }
    },

    // фейковый запрос
    abortableFetch(url, args) {
      const controller = new AbortController();
      const signal = controller.signal;
      return {
        'abort': () => controller.abort(),
        'ready': fetch(url, {...args, 'signal': signal})
      };
    },

    // добавление какого-то стчетчика
    removePromise(innerPromises) {
      innerPromises = 't' + innerPromises;
      if (innerPromises in this.innerPromises) {
        delete this.innerPromises[innerPromises];
      }
    },

    // еще что-то
    abortPromises() {
      //console.log('abortPromises');

      for (let innerPromise in this.innerPromises) {
        if (this.innerPromises.hasOwnProperty(innerPromise)) {

          this.innerPromises[innerPromise].abort();
        }
      }
      this.innerPromises = {};
      this.innerChannelCounter = 0;
    },

    //Сохранить настройки системы
    saveTimer() {

      if (this.isCanSave ) {
        this.saveText = 'Saving';

        let data = {
          openModal: this.openModal,
          refreshType: this.refreshType,
          refreshInterval: parseInt(this.refreshInterval),
          refreshIntervalStart: parseInt(this.refreshIntervalStart),
          refreshIntervalEnd: parseInt(this.refreshIntervalEnd),
          actionType: this.actionType,
          countcar: parseInt(this.countcar),
          one_click_book: this.one_click_book ? 1 : 0,

          one_book_empty: this.one_book_empty ? 1 : 0,
          one_book_empty_count: this.one_book_empty_count

        };

        localStorage.setItem('cargomatic', JSON.stringify(data));
        setTimeout(() => {
          this.saveText = 'Saved';
        }, 300);

        setTimeout(() => {
          this.saveText = 'Save';
        }, 1000);
      }

    }

  }

}
</script>

<style scoped>

</style>
