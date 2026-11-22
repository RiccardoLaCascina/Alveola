# data

Dove vivono i dati salvati sul telefono (IndexedDB, tramite Dexie).

- `db.ts`: definizione del database e delle sue tabelle
- `proveRepository.ts`: salva, legge ed elenca le prove del diario

I componenti non parlano mai direttamente con il database: passano dal repository.
Così, se un domani i dati andranno anche su un server, cambia solo questo livello.
