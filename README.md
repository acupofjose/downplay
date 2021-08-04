<p style="text-align:center">
<img src=".github/logo.png" style="display: block; margin: 0 auto; max-width: 100%; width: 500px">
</p>

---

Goals:

- [x] Entirely Self-Hostable
- [x] `Dockerfile` and sample `docker-compose.yml`
- [x] Easy to use REST API
- [x] User Authentication System
- [x] Simultaneous Workers for multiple downloads
- [x] Queuing System with Persistence through Server Restarts
- [x] Download Youtube Videos
- [x] Download Youtube Playlists
- [x] Download Thumbnail Artwork
- [x] Transcode Audio to `.mp3` format
- [x] Add ID3 tags to mp3 files
- [x] Play files from client
- [x] Live updating client
- [ ] CRUD Operations
- [x] Settings management from client
- [ ] Queue channels to watch and automatically download
- [ ] Webhooks / Notifications

## Getting Started

Generate a new `JWT_SECRET` and put it into your `.env` file.

```bash
$ cp .env.example .env
$ openssl rand -hex 32
```

Using the `docker-compose.yml` in this repo, adjust the settings accordingly to your setup.

**You should change the DB passwords and make sure ports are not exposed**

Then it's as simple as:

```bash
$ docker-compose up -d
```

## API

**POST `auth/login`**

**POST `auth/register`**

**GET `entity`**

**GET `entity/:id`**

**GET `entity/stream/:id`**

**GET `entity/thumbnail/:id`**

**POST `entity/delete/:id`**

**POST `queue`**

**GET `queue`**

**GET `queue/:id`**

**POST `queue/delete/:id`**
