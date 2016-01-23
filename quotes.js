Quotes = new Mongo.Collection('quotes', {
    transform: function (entry) {
        entry.iconUrl = '/icons/' + entry.icon + '.png';
        return entry;
    }
});

admin = function () {
    if (Meteor.user()) {
        console.log('Run this command on the server to become admin:');
        console.log('\tmeteor shell');
        console.log('\tRoles.setUserRoles(\'' + Meteor.userId() +  '\', [\'admin\'])');
        return '';
    } else {
        return 'You are not logged in';
    }
}

function toggleQuoteBox() {
    Session.set('addQuoteOpen', !Session.get('addQuoteOpen'));
}

function canModerateQuotes() {
    return Roles.userIsInRole(Meteor.user(), ['admin', 'quote-moderator']);
}

function canModerateQuote(quote) {
    if (canModerateQuotes()) {
        // Users has moderation powers
        return true;
    }

    if (!quote.submitter)
        // The quote was added by an anonymous users
        return false;

    return quote.submitter === Meteor.userId();
}

if (Meteor.isClient) {
    $(document).ready(function() {
        $('.signin-bttn').on('click', function(e) {
            $('.signin-dialog').toggleClass('signin-out');
            e.preventDefault();
        });
    }); 

    function toggleLocalEditing(quoteId, state, edited) {
        Quotes._collection.update({_id: quoteId}, {
            $set: {
                editing: state,
                edited: edited
            }
        });
    }
    
    Meteor.subscribe('quotes');


    Template.quotes.helpers({
        quotes: function () {
            return Quotes.find({}, {sort: {dateSubmitted: -1}});
        },

        canModerate: function () {
            return canModerateQuote(this);
        },

        quoteAnimateClass: function () {
            return Quotes.findOne({_id: this._id}).edited ? '' : 'animated';
        }
    });

    Template.quotes.events({
        'click .quote-mod-del': function(e) {
            e.preventDefault();
            var id = e.target.parentNode.parentNode.getAttribute('quote-id');

            Meteor.call('removeQuote', id);
        },
        'click .quote-mod-edit': function(e) {
            e.preventDefault();
            var id = e.target.parentNode.parentNode.getAttribute('quote-id');
            toggleLocalEditing(id, true, true);
        }
    });

    Template.body.helpers({
        addQuoteOpen: function () {
            return Session.get('addQuoteOpen');
        },
        loggedIn: function () {
            return Meteor.user();
        }
    });

    Template.userLevel.helpers({
        userLevel: function () {
            return Roles.getRolesForUser(Meteor.user());
        }
    });

    Template.addQuote.helpers({
        loggedIn: function () {
            return Meteor.user();
        },
        addText: function () {
            return this.editing ? 'Save' : 'Add quote';
        },
        quoteAnimateClass: function () {
            return (typeof this._id !== 'undefined') ? '' : 'animated';
        }
    });

    Template.addQuote.events({
        'submit .add-quote': function (e) {
            e.preventDefault();

            var quote = e.target.querySelector('.quote-text').innerText;
            var where = e.target.where.value;
            var who = e.target.who.value;

            if (quote.length <= 0 || quote.length >= 1024)
                return alert('Your quote has to be between 1 and 1024 characters');

            if (where.length <= 0 || quote.length >= 128)
                return alert('Your where field has to be between 1 and 128 characters');

            if (who.length <= 0 || who.length >= 128)
                return alert('Your who field has to be between 1 and 128 characters');

            if (this.editing) {
                var id = this._id;
                Meteor.call('editQuote', this._id, quote, where, who, function(err) {
                    if (err) {
                        alert('Could not edit the quote');
                    }
                    toggleLocalEditing(id, false, true);   
                });
            } else {
                Meteor.call('addQuote', quote, where, who, function(err) {
                   if (err) {
                        alert('Could not submit the quote :(');
                   }
                });
                toggleQuoteBox();
            }
        },
        'click .cancel-button': function (e) {
            if (this.editing) {
                toggleLocalEditing(this._id, false, true);
            } else {
                toggleQuoteBox();
            }
        }
    });

    Template.body.events({
        'click .action-add': toggleQuoteBox
    });

    Template.body.rendered = function() {
        var container = document.querySelector('.quotes');
        container._uihooks = {
            insertElement: function (node, next) {
                var quoteId = node.getAttribute('quote-id');
                var quote = Quotes.findOne({_id: quoteId});
                if (quote && quote.edited) {
                    // Delay quotes that where just edited
                    setTimeout(function() {
                        container.insertBefore(node, next);

                        setTimeout(function() {
                            toggleLocalEditing(quoteId, false, false);
                        }, 1000);
                    }, 500);
                } else {
                    container.insertBefore(node, next);
                }
            },
            removeElement: function (node) {
                // Check if the quote is getting edited
                var id = node.getAttribute('quote-id');
                if (id) {
                    var quote = Quotes.findOne({_id: id});
                    if (quote && quote.editing) {
                        node.parentNode.removeChild(node);
                        return;
                    }
                }

                // Check if it was an editing form
                if (node.getAttribute('editing')) {
                    $(node).find('.button-animation').removeClass('button-animation').addClass('button-reverse');
                    setTimeout(function() {
                        node.parentNode.removeChild(node);
                    }, 500);
                    return;
                }

                node.classList.remove('bounceIn');
                node.classList.remove('fadeInDown');
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
        check(author, StringBetween(1, 128));

        Quotes.insert({
            text: text,
            game: game,
            author: author,
                    submitter: Meteor.userId(),
            dateSubmitted: new Date()
        });
    },

    removeQuote: function(id) {
        check(id, String);

        var quote = Quotes.findOne({_id: id});
        if (canModerateQuote(quote)) {
            Quotes.remove({_id: id});
        }
    },

    editQuote: function(id, text, game, author) {
        check(id, String);
        check(text, StringBetween(1, 1024));
        check(game, StringBetween(1, 128));
        check(author, StringBetween(1, 128));

        var quote = Quotes.findOne({_id: id});

        if (canModerateQuote(quote)) {
            Quotes.update({_id: id}, {
                $set: {
                    text: text,
                    game: game,
                    author: author
                }
            });
        }
    }
});
