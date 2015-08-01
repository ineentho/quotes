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
    
    Meteor.subscribe('quotes');


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

    Template.addQuote.helpers({
        loggedIn: function () {
            return Meteor.user();
        }
    });

    Template.addQuote.events({
        'submit .add-quote': function (e) {
            e.preventDefault();

            var quote = e.target.quote.value;
            var where = e.target.where.value;
            var who = e.target.who.value;

            if (quote.length <= 0 || quote.length >= 1024)
                return alert('Your quote has to be between 1 and 1024 characters');

            if (where.length <= 0 || quote.length >= 128)
                return alert('Your where field has to be between 1 and 128 characters');

            if (who.length <= 0 || who.length >= 128)
                return alert('Your who field has to be between 1 and 128 characters');

            Meteor.call('addQuote', quote, where, who, function(err) {
               if (err) {
                    alert('Could not submit the quote :(');
               } else {
                   // TODO: Show that the quote was properly submitted
               }
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
    Meteor.publish('quotes', function() {
        return Quotes.find();
    });
}


var StringBetween = function (min, max) {
    return Match.Where(function (x) {
        check(x, String);
        return x.length >= min && x.length <= max;
    });
}


Meteor.methods({
    addQuote: function(text, game, author) {
        check(text, StringBetween(1, 1024));
        check(game, StringBetween(1, 128));

        Quotes.insert({
            text: text,
            game: game,
            author: author,
            submitter: Meteor.userId(),
            dateSubmitted: new Date()
        });
    }
});
