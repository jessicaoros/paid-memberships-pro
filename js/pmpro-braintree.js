jQuery(document).ready(function ($) {

    pmpro.order = pmproBraintree.order;

    var hostedFields, threeDSecure;

    braintree.client.create({
        // Use the generated client token to instantiate the Braintree client.
        authorization: pmproBraintree.clientToken
    }).then(function (clientInstance) {
        setupComponents(pmproBraintree.clientToken)
            .then(function (instances) {
                hostedFields = instances[0];
                threeDSecure = instances[1];
            }).catch(function (e) {
            console.log(e);
        });
    }).catch(function (e) {
        console.log(e);
    });

    // Handle authentication if required.
    pmpro.order.error = true;
    pmpro.order.errortype = 'verification_required';
    if ( pmpro.order.error && 'verification_required' === pmpro.order.errortype ) {
        // On submit disable its submit button
        $('input[type=submit]', this).attr('disabled', 'disabled');
        $('input[type=image]', this).attr('disabled', 'disabled');
        $('#pmpro_processing_message').css('visibility', 'visible');

        if ( 'verified' !== pmproBraintree.initialAmount ) {
            amount = pmproBraintree.initialAmount;
        } else {
            amount = pmproBraintree.recurringAmount;
        }

        threeDSecure.verifyCard({
            onLookupComplete: function (data, next) {
                next();
            },
            amount: amount,
            nonce: pmproBraintree.paymentMethod.nonce,
            bin: response.details.bin,
            // billingAddress: billingAddress,
        }).then(braintreeResponseHandler);
    }

    $('.pmpro_form').on( 'submitOrderReady', function (event) {

        console.log( 'Doing Braintree stuff.' );

        var billingAddress;

        // TODO Double check in case a discount code made the level free.
        if ( pmpro_require_billing ) {
            hostedFields.tokenize()
                .then(braintreeResponseHandler)
                .catch( function (e) {
                    // TODO Handle errors.
                    // pmpro.error = e.message;
                    console.log(e);
                });
        }
    });

    // Handle the response from Braintree.
    function braintreeResponseHandler( response ) {

        var form;

        form = $('#pmpro_form, .pmpro_form');

        if ('CreditCard' === response.type) {
            console.log( 'tokenized card' );
            // TODO Always pass these if available to optimize 3DS challenges.
            // if ( pmproBraintree.verifyAddress ) {
            //     billingAddress = {
            //         streetAddress: $( '#baddress1' ).val(),
            //         extendedAddress: $( '#baddress2' ).val(),
            //         locality: $( '#bcity' ).val(),
            //         region: $( '#bstate' ).val(),
            //         postalCode: $( '#bzipcode' ).val(),
            //         countryCodeAlpha2: $( '#bcountry' ).val(),
            //     };
            // }

            // add first and last name if not blank
            // if ( $( '#bfirstname' ).length && $( '#blastname' ).length ) {
            //     billingAddress.givenName = $( '#bfirstname' ).val();
            //     billingAddress.surname = $( '#blastname' ).val();
            // }

            $( '#braintree_payment_method_nonce' ).val( response.nonce );
            $( '#CardType' ).val( response.details.cardType );
            $( '#BraintreeAccountNumber' ).val( 'XXXXXXXXXXXX' + response.details.lastFour );
            $( 'input[name="ExpirationMonth"]' ).val( ( '0' + response.details.expirationMonth ).slice( -2 ) );
            $( 'input[name="ExpirationYear"]' ).val( response.details.expirationYear );
            $( '#credit_card_exp' ).val( ( '0' + response.details.expirationMonth ).slice( -2 ) + '/' + response.details.expirationYear );

            form.get(0).submit();

            // pmproBraintree.recurringAmountVerified = false;
            // if ( pmpro.order.initial_amount && ! pmproBraintree.initialAmountVerified ) {
            //     console.log( 'Verifying initial amount' );
            //     threeDSecure.verifyCard({
            //         onLookupComplete: function (data, next) {
            //             next();
            //         },
            //         amount: pmpro.order.initial_amount,
            //         nonce: response.nonce,
            //         bin: response.details.bin,
            //         // billingAddress: billingAddress,
            //     }).then(braintreeResponseHandler);
            // } else if ( pmpro.order.subscription_amount && ! pmproBraintree.recurringAmountVerified ) {
            //     $( '#braintree_payment_method_nonce' ).val( response.nonce );
            //     form.get(0).submit();
            // }
        } else {
            // console.log( 'verified card' );
            // $( '#braintree_payment_method_nonce' ).val( response.nonce );
            // form.get(0).submit();
        }
    }


    function setupComponents(clientToken) {
        return Promise.all([
            braintree.hostedFields.create({
                authorization: clientToken,
                styles: {
                    input: {
                        // 'font-size': '14px',
                        // 'font-family': 'monospace'
                    }
                },
                fields: {
                    number: {
                        selector: '#AccountNumber',
                    },
                    expirationMonth: {
                        selector: '#ExpirationMonth',
                    },
                    expirationYear: {
                        selector: '#ExpirationYear',
                    },
                    cvv: {
                        selector: '#CVV',
                    }
                }
            }),
            braintree.threeDSecure.create({
                authorization: clientToken,
                version: 2
            })
        ]);
    }

});

