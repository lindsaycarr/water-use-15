process.format_site_locations <- function(viz) {
  deps <- readDepends(viz)
  data <- deps[["data"]]
  
  data_formatted <- data %>% 
    mutate(state_abbv = stateCdLookup(state_cd)) %>% 
    mutate(GEOID = paste0(state_cd, county_cd),
           UNIQUE_ID = site_no,
           STATE_ABBV = state_abbv,
           COUNTY = station_nm,
           countypop = NA,
           total = 20,
           thermoelectric = 20,
           publicsupply = 20,
           irrigation = 20,
           industrial = 20,
           other = 20,
           lat = dec_lat_va,
           lon = dec_long_va) %>% 
    select(-c(site_no, station_nm, dec_lat_va, dec_long_va, state_cd, county_cd, state_abbv))
  
  readr::write_tsv(data_formatted, path=viz[['location']])
}
