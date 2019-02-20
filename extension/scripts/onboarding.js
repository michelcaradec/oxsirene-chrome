'use strict';

/**
 * Show on-boarding help.
 */
function onboarding() {
    const intro = introJs();
    intro.setOptions({
        nextLabel: '&rarr;',
        prevLabel: '&larr;',
        skipLabel: 'Stop',
        doneLabel: 'Fin',
        steps: [
            {
                element: '#locationInput',
                intro: 'Un lieu de livraison est pré-alimenté.',
                position: 'bottom'
            },
            {
                element: '#locationInput',
                intro: 'Complétez ou saisissez le lieu de livraison souhaité.',
                position: 'bottom'
            },
            {
                element: '#checkLocation',
                intro: 'Un clic sur ce bouton permet de valider le lieu de livraison.'
            },
            {
                element: '#open-street-map',
                intro: 'Le lieu de livraison apparaît sur la carte.'
            },
            {
                element: '#runEstimate',
                intro: 'Un clic sur ce bouton permet de lancer l\'estimation.'
            },
            {
                intro: 'Les étapes de l\'estimation s\'affichent sur un second onglet.'
            },
            {
                intro: 'Le résultat de l\'estimation s\'affiche sur un troisième onglet.'
            }
        ]
    });

    intro.start();
}