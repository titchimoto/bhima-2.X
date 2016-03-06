/** 
 * PatientInvoice Service 
 *
 * Service to interact with the /patient_invoice HTTP end point. Responsible 
 * for curating data provided from the patient invoice controller and formatting
 * it for submission to be written on the server.
 *
 * @module services/PatientInvoice
 */
angular.module('bhima.services')
.service('PatientInvoice', PatientInvoice);

PatientInvoice.$inject = ['$http', 'util', 'SessionService'];

/**
 * @constructor PatientInvoice
 */
function PatientInvoice($http, util, SessionService) { 
  var service = this;
  var invoiceUrl = '/sales';

  /** Method to format and send a valid patient invoice request. */
  service.create = create;

  function create(invoiceDetails, invoiceItems) { 
    var invoice; 
  
    invoiceDetails = addSessionDetails(invoiceDetails);
    invoiceItems = invoiceItems.map(filterInventorySource);
  
    console.log('sending items', invoiceItems);
    // TODO Make all naming consisten
    invoice = { 
      sale : invoiceDetails,
      saleItems : invoiceItems
    };

    return $http.post(invoiceUrl, invoice)
      .then(util.unwrapHttpResponse);
  }

  // Utility methods 
  
  // TODO These details could be added on the client or the server - a design 
  // decision that should be made going forward and similarly adopted among 
  // all services
  function addSessionDetails(invoice) { 
    invoice.project_id = SessionService.project.id;

    /**
     * @todo Discuss - do invoices need a currency ID? We only ever bill in the 
     * enterprise currency
     */
    invoice.currency_id = SessionService.enterprise.currency_id;
    return invoice;
  }
  
  // Remove the ousrce items from invoice items - if they exist
  function filterInventorySource(item) { 
    delete item.sourceInventoryItem;
    delete item.description;
    delete item.confirmed;
    delete item.code;
    delete item.priceListApplied;
    
    return item;
  }
}
