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




