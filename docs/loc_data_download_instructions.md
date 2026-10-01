# Library of Congress: Data Download Instructions

This document outlines the terminal commands required to safely and rapidly download the bulk Library of Congress (LOC) MARC datasets to the `Raw_Data` folder.

## The Target Dataset
*   **Collection:** "Books All" (Retrospective 2019)
*   **Permalink:** https://lccn.loc.gov/2020445551
*   **Digital ID:** https://hdl.loc.gov/loc.gdc/gdcdatasets.2020445551_2019
*   **Size:** ~12.8 GB compressed ZIP

## Download Script
Because the dataset is nearly 13GB, do not use standard `wget` or `curl`, as a dropped connection will force you to restart from zero. 

Instead, we use `aria2c`, which supports multi-connection downloading (splitting the file into chunks) and automatic resumption.

Run the following commands in your terminal:

```bash
# 1. Navigate to the Raw Data directory
cd Raw_Data

# 2. Download the 2019 MARC XML dataset using 16 concurrent connections
aria2c -x 16 -s 16 -j 16 "https://tile.loc.gov/storage-services/master/gdc/gdcdatasets/2020445551_2019/2020445551_2019.zip"

# 3. Unzip the downloaded file (the output filename will depend on the LOC server redirect)
# For example, if it downloads as 2020445551_2019.zip:
# unzip 2020445551_2019.zip
```

### Explanation of the `aria2c` flags:
*   `-x 16`: Opens 16 maximum connections to the LOC server.
*   `-s 16`: Splits the file into 16 chunks to download simultaneously.
*   `-j 16`: Allows 16 concurrent downloads.
*   *Note: `aria2c` automatically follows HTTP 302 redirects, so passing the `hdl.loc.gov` permalink is perfectly safe and will resolve to the underlying ZIP file.*
