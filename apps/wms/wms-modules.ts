// In NestJS ist ein Modul (immer mit @Module() markiert) so etwas wie ein „Container“,
//der alle Teile dieses einen Services bündelt.

//Beim WMS besteht dein Service z. B. aus:

//einer Klasse, die auf RabbitMQ-Nachrichten reagiert (→ WmsSimService)

//eventuell weiteren Helper-Services

//evtl. Logger, Config usw.

//Das Modul sagt also Nest:

//"Wenn ich starte, hier sind meine Provider (z. B. Services),
//und so ist mein Service zusammengesetzt."