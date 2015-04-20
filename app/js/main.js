(function() {
    var nom = "Valeur";

    console.log(nom);

    nom = 42;

    console.log(nom);

    /**
     * Displays something on the console.
     * @param {string} param - Object to be displayed in the console.
     */
    function faitUnTruc(param) {
        console.log(param);
    }

    faitUnTruc(nom);

    function carre(nombre) {
        return nombre * nombre;
    }

    console.log(carre(3));


    var i = 0;
    while(true) {
        if(i==100) {
            break;
        }
        console.log(i);
        i ++;
    }


    for(i = 0; i < 100; i++) {
        console.log(i);
    }


    var personne = {
        nom: "Toto",
        prenom: "Titi",
        age: 10
    };

    console.log(personne.prenom + " " + personne.nom + " a " + personne.age + " ans.");

    function hello(p) {
        console.log(p.prenom + " " + p.nom + " a " + p.age + " ans.");
    }

    hello(personne);

    var methode = function(p) {
        console.log(p);
    };

    methode("Toto");
    methode.call(null, "Toto");
    
});




(function() {
    
    var packing = require('./js/packing.js');
    var Item = packing.Item;

    var items = [
        new Item(10, 20),
        new Item(30, 10),
        new Item(42, 25),
        new Item(15, 15)
    ];
    
    var options = {
        pattern: {
            width: 100,
            height: 40,
            min: 0,
            max: 10
        }
    };
    
    packing.pack(items, options);
    
})();
