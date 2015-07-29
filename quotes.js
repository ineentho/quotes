Quotes = new Mongo.Collection('quotes', {
    transform: function (entry) {
        entry.iconUrl = '/icons/' + entry.icon + '.png';
        return entry;
    }
});

if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault('counter', 0);

  Template.quotes.helpers({
    quotes: function () {
        return Quotes.find({});
    }
  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
