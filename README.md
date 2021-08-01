# Downplay

#### A free, self-hostable, youtube-as-a-podcast service.

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
- [ ] Add ID3 tags to mp3 files
- [ ] Play files from client
- [x] Live updating client
- [ ] CRUD Operations
- [ ] Settings management from client

## Getting Started

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
