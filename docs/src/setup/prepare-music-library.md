# Prepare your music library

The toughest part is to have an organised music library. The way files are organised are up to you! But here is a recommended architecture:

```tree
Library's Folder   
│
Artist 1
│   │
│   └───Album 1
│       │   01 Track 1.m4a
│       │   02 Track 2.m4a
|       |   cover.jpg
│       │   ...
│   ...
```

Meelo provides two ways of collecting metadata: using embedded tags, or using the path of the file. If a metadata source does not provide a specific field, you can use the other as a fallback. (You will configure this behaviour in the next sections). But before going any further, you should decide which metadata collection method to use.
