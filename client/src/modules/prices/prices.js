// TODO Handle HTTP exception errors (displayed contextually on form)
angular.module('bhima.controllers').controller('PriceListController', PriceListController);

PriceListController.$inject = [
  'PriceListService', '$uibModal', 'InventoryService',
  'ModalService', 'util', 'NotifyService', 'appcache', 'LanguageService',
  '$httpParamSerializer',
];

function PriceListController(
  PriceListService, $uibModal, Inventory, ModalService,
  util, Notify, AppCache, Languages, $httpParamSerializer
) {
  const vm = this;
  vm.view = 'default';

  // bind methods
  vm.create = create;
  vm.submit = submit;
  vm.update = update;
  vm.del = del;
  vm.cancel = cancel;
  vm.addItem = addItem;
  vm.getInventory = getInventory;
  vm.removeItem = removeItem;

  vm.length250 = util.length250;
  vm.maxLength = util.maxTextLength;

  // Here we create a cache, all items in the list will be in it
  const cache = new AppCache('selectedItems');

  // fired on startup
  function startup() {
    // start up loading indicator
    vm.loading = true;

    // load Inventory
    Inventory.read()
      .then((inventory) => {
        vm.inventories = inventory;
      })
      .catch(Notify.handleError);

    // load PriceList
    refreshPriceList();
  }

  function cancel() {
    vm.view = 'default';
  }

  function getInventory(uuid) {
    const inventory = vm.inventories.filter(item => {
      return item.uuid === uuid;
    });

    return inventory[0].label;
  }

  function removeItem(item) {
    if (vm.pricelistItems.length > 1) {
      vm.pricelistItems.splice(vm.pricelistItems.indexOf(item), 1);
    } else {
      ModalService.alert('PRICE_LIST.UNABLE_TO_DELETE');
    }
  }

  function create() {
    vm.priceList = null;
    vm.pricelistItems = [];
    vm.view = 'create';
  }

  // switch to update mode
  // data is an object that contains all the information of a priceList
  function update(data) {
    vm.view = 'update';
    vm.priceList = data;

    PriceListService.read(data.uuid)
      .then((response) => {
        vm.pricelistItems = response.items;
      })
      .catch(Notify.handleError);
  }


  // refresh the displayed PriceList
  function refreshPriceList() {
    return PriceListService.read(null, { detailed : 1 }).then(data => {
      vm.loading = false;
      vm.priceLists = data;
    });
  }

  // form submission
  function submit(invalid) {
    if (invalid) {
      Notify.danger('FORM.ERRORS.HAS_ERRORS');
      return;
    }


    const creation = (vm.view === 'create');

    vm.priceList.items = vm.pricelistItems.length ? vm.pricelistItems : null;

    const priceList = angular.copy(vm.priceList);

    const promise = (creation) ?
      PriceListService.create(priceList) :
      PriceListService.update(priceList.uuid, priceList);

    promise
      .then(() => {
        return refreshPriceList();
      })
      .then(() => {
        const message = creation ? 'FORM.INFO.CREATE_SUCCESS' : 'FORM.INFO.UPDATE_SUCCESS';
        Notify.success(message);
        vm.view = 'default';
      })
      .catch(Notify.handleError);
  }

  // switch to delete warning mode
  function del(priceList) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE').then(bool => {
      // if the user clicked cancel, reset the view and return
      if (!bool) {
        vm.view = 'default';
        return;
      }

      // if we get there, the user wants to delete a priceList
      PriceListService.delete(priceList.uuid)
        .then(() => {
          Notify.success('FORM.INFO.DELETE_SUCCESS');
          return refreshPriceList();
        })
        .catch(Notify.handleError);
    });
  }

  // Add pricelist Item in a  modal
  function addItem() {

    // let stock items int our cache, we will use it in the modal
    cache.items = vm.pricelistItems;

    return $uibModal.open({
      templateUrl : 'modules/prices/modal.html',
      controller : 'PriceListModalController as ModalCtrl',
      keyboard : false,
      backdrop : 'static',
      size : 'md',
    }).result
      .then(items => {
        vm.pricelistItems.push(items);
      });
  }

  vm.download = () => {

    const options = {
      renderer : 'pdf',
      lang : Languages.key,
    };
    // return  serialized options
    return $httpParamSerializer(options);
  };
  startup();
}
