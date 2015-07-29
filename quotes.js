Quotes = new Mongo.Collection('quotes', {
    transform: function (entry) {
        entry.iconUrl = '/icons/' + entry.icon + '.png';
        return entry;
    }
});

function toggleQuoteBox() {
    Session.set('addQuoteOpen', !Session.get('addQuoteOpen'));
}

if (Meteor.isClient) {

    Template.quotes.helpers({
        quotes: function () {
            return Quotes.find({});
        }
    });

    Template.body.helpers({
        addQuoteOpen: function () {
            return Session.get('addQuoteOpen');
        }
    });

    Template.body.events({
        'click .action-add': toggleQuoteBox,
        'click .cancel-button': toggleQuoteBox
    });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
