// requries
const express = require( 'express' );
const app = express();
const bodyParser = require( 'body-parser' );
const pg = require( 'pg' ); // this is what lets us talk to db

// uses
app.use( express.static( 'server/public' ) );
app.use( bodyParser.urlencoded( { extended: true } ) );

// globals
const port = 3000;

// db setup
const Pool = pg.Pool;     // pg.Pool is NOT tacos
// configure the connection to db
const pool = new Pool({
    database: "music_library", // db name (NOT table name)
    host: "localhost", // deafult when running locally, will change when deploying
    port: 5432, // default port for local, also will change when deployed
    max: 12, // max # of connections
    idleTimeoutMillis: 20000 // connection time out in ms
}); // end pool setup

// spin up server
app.listen( port, ()=>{
    console.log( 'server up:', port );
}) // end server up

app.get( '/songs', ( req, res )=>{
    console.log( 'in /songs GET' );
    // test query: top 40 songs by rank
    // SELECT * FROM "songs" ORDER BY "rank" DESC LIMIT 40;
    const queryString = 'SELECT * FROM "songs" ORDER BY "rank" ASC LIMIT 40;';
    pool.query( queryString ).then( ( results )=>{
        res.send( results.rows ); //runs if query was successful
    }).catch( ( err )=>{
        console.log( err ); // if there was an error running query
        res.sendStatus( 500 );
    }) // end query
}) // end /songs GET

// Get a single song
// Endpoint: GET /songs/:id
app.get( '/songs/:id', ( req, res ) => {
    console.log("song ID to retrieve", req.params.id);

    // Grab song ID from URL params
    let songId = req.params.id;

    const queryString = `SELECT * FROM "songs" WHERE "id" = $1;`
    pool.query(queryString, [songId])
        .then((results) => {
            res.send(results.rows)
        })
        .catch((err) => {
            console.error("ERROR!!!", err);
            res.sendStatus(500);
        });
} )

app.post( '/songs', ( req, res )=>{
    console.log( 'in /songs POST:', req.body );
    // create query string
    const queryString = `INSERT INTO "songs" (rank, artist, track, published) VALUES ( $1, $2, $3, $4 )`;
    // ask pool to run our Query String
    pool.query( queryString, [ req.body.rank, req.body.artist, req.body.track, req.body.published ] ).then( ( results )=>{
        res.sendStatus( 201 ); // success, created
    }).catch( ( err ) =>{
        console.log( err );
        res.sendStatus( 500 );
    }) // end query
}) // end /songs POST

app.delete( '/songs/:id', ( req, res ) => {
    console.log('req.params', req.params);

    const queryString = `DELETE FROM "songs" WHERE "id" = $1;`

    // Grab the :id param from the URL
    let songId = req.params.id;     // 5
    console.log("Gonna delete song with id=", songId);

    // Execute DB query
    pool.query(queryString, [songId])
        .then((response) => {
            console.log("Deleted!");
            res.sendStatus(200);
        })
        .catch((err) => {
            console.log("Error deleted record", err);
            res.sendStatus(500);
        })
});

app.put( '/songs/:id', ( req, res ) => {
    console.log("params", req.params.id, req.body);
    let queryString = '';

    if(req.body.direction === 'up'){
        queryString = `UPDATE "songs" SET "rank" = "rank"-1 WHERE "id" = ${req.params.id}`;
    } else if (req.body.direction === 'down'){
        queryString = `UPDATE "songs" SET "rank" = "rank"+1 WHERE "id" = ${req.params.id}`;
    } else {
        console.log("send better data");
    }

    pool.query(queryString)
    .then((result) => {
        console.log("RESULT from put!", result);
        res.sendStatus(200);
    }).catch((err) => {
        console.log("Error from put!", err);
        res.sendStatus(500);
    });

});