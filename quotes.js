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
            return Quotes.find({}, {sort: {dateSubmitted: -1}});
        }
    });

    Template.body.helpers({
        addQuoteOpen: function () {
            return Session.get('addQuoteOpen');
        }
    });

    Template.addQuote.events({
        'submit .add-quote': function (e) {
            e.preventDefault();
            console.log(this); 


            var quote = e.target.quote.value;
            var where = e.target.where.value;
            var who = e.target.who.value;

            Quotes.insert({
                text: quote,
                game: where,
                author: who,
                submitter: Meteor.userId(),
                dateSubmitted: new Date()
            });
            toggleQuoteBox();
        }
    });

    Template.body.events({
        'click .action-add': toggleQuoteBox,
        'click .cancel-button': toggleQuoteBox,
    });

    Template.body.rendered = function() {
        document.querySelector('.quotes')._uihooks = {
            removeElement: function (node) {
                node.classList.remove('bounceIn');
                node.classList.add('bounceOut');;

                setTimeout(function() {
                   node.parentNode.removeChild(node);
                }, 750);
            }
        };
    };

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
